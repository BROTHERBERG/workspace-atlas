const CACHE_NAME = 'workspace-atlas-v1'
const STATIC_CACHE_NAME = 'workspace-atlas-static-v1'
const DYNAMIC_CACHE_NAME = 'workspace-atlas-dynamic-v1'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/directory',
  '/score-my-space',
  '/recruitment',
  '/haven-passport',
  '/manifest.json',
  // Add critical CSS and JS files here when available
]

// Assets to cache dynamically
const CACHE_STRATEGIES = {
  // API endpoints - Network first, cache fallback
  api: {
    pattern: /^\/api\//,
    strategy: 'networkFirst'
  },
  // Images - Cache first
  images: {
    pattern: /\.(jpg|jpeg|png|gif|webp|svg)$/,
    strategy: 'cacheFirst'
  },
  // Static assets - Cache first
  static: {
    pattern: /\.(css|js|woff|woff2|ttf|eot)$/,
    strategy: 'cacheFirst'
  },
  // Pages - Network first, cache fallback
  pages: {
    pattern: /\/(?:directory|score-my-space|recruitment|haven-passport|spaces|profile)/,
    strategy: 'networkFirst'
  }
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('✅ Service Worker: Static assets cached')
        return self.skipWaiting()
      })
  )
})

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('⚡ Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('workspace-atlas-') && 
                     cacheName !== STATIC_CACHE_NAME && 
                     cacheName !== DYNAMIC_CACHE_NAME
            })
            .map((cacheName) => {
              console.log(`🗑️ Service Worker: Deleting old cache: ${cacheName}`)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => {
        console.log('✅ Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') return
  
  // Skip chrome extension requests
  if (url.protocol === 'chrome-extension:') return
  
  // Skip hot reload requests in development
  if (url.pathname.includes('/_next/webpack-hmr')) return
  if (url.pathname.includes('/_next/static/chunks/pages/_error')) return

  event.respondWith(handleFetch(request))
})

async function handleFetch(request) {
  const url = new URL(request.url)
  
  try {
    // Determine caching strategy based on request
    for (const [name, config] of Object.entries(CACHE_STRATEGIES)) {
      if (config.pattern.test(url.pathname) || config.pattern.test(url.href)) {
        return await applyStrategy(request, config.strategy)
      }
    }
    
    // Default strategy - network first
    return await applyStrategy(request, 'networkFirst')
  } catch (error) {
    console.error('Service Worker fetch error:', error)
    return await handleOfflineFallback(request)
  }
}

async function applyStrategy(request, strategy) {
  switch (strategy) {
    case 'cacheFirst':
      return await cacheFirst(request)
    case 'networkFirst':
      return await networkFirst(request)
    case 'staleWhileRevalidate':
      return await staleWhileRevalidate(request)
    default:
      return await networkFirst(request)
  }
}

// Cache first strategy - good for static assets
async function cacheFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    // Optionally update cache in background
    updateCacheInBackground(request, cache)
    return cachedResponse
  }
  
  const networkResponse = await fetch(request)
  
  if (networkResponse.status === 200) {
    cache.put(request, networkResponse.clone())
  }
  
  return networkResponse
}

// Network first strategy - good for dynamic content
async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME)
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache:', error)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

// Stale while revalidate - good for frequently updated content
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  // Always try to update cache in background
  const networkPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  })
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse
  }
  
  // Otherwise wait for network response
  return await networkPromise
}

// Update cache in background without blocking response
function updateCacheInBackground(request, cache) {
  fetch(request).then((response) => {
    if (response.status === 200) {
      cache.put(request, response)
    }
  }).catch((error) => {
    console.log('Background cache update failed:', error)
  })
}

// Handle offline fallbacks
async function handleOfflineFallback(request) {
  const url = new URL(request.url)
  
  // Try to serve from any cache
  const response = await caches.match(request)
  if (response) {
    return response
  }
  
  // Offline page for navigation requests
  if (request.destination === 'document') {
    const offlineResponse = await caches.match('/offline.html')
    if (offlineResponse) {
      return offlineResponse
    }
    
    // Fallback offline response
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Workspace Atlas - Offline</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            text-align: center;
            padding: 50px;
            background: #1f1f1f;
            color: white;
          }
          .logo {
            color: #f9cb16;
            font-size: 2rem;
            margin-bottom: 2rem;
          }
          .message {
            font-size: 1.2rem;
            margin-bottom: 1rem;
          }
          .retry-btn {
            background: #f9cb16;
            color: black;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1rem;
            margin-top: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="logo">🌐 Workspace Atlas</div>
        <div class="message">You're currently offline</div>
        <p>Please check your internet connection and try again.</p>
        <button class="retry-btn" onclick="location.reload()">Retry</button>
      </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }
  
  // Default offline response
  return new Response('Offline', { status: 503 })
}

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered')
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Implement background sync logic for forms, scores, etc.
  console.log('📤 Service Worker: Performing background sync')
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('📬 Service Worker: Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from Workspace Atlas',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'workspace-atlas-notification',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/icons/action-explore.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/action-close.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('Workspace Atlas', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Notification clicked')
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/directory')
    )
  } else if (event.action === 'close') {
    // Just close the notification
    return
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})