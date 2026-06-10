#!/usr/bin/env node
/**
 * Bundle analysis script for production builds
 * Usage: npm run analyze-bundle
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🔍 Analyzing bundle size and composition...\n')

// Set environment variable for bundle analyzer
process.env.ANALYZE = 'true'

try {
  // Build with analysis
  console.log('📦 Building production bundle with analyzer...')
  execSync('npm run build', { stdio: 'inherit' })

  // Check if bundle analyzer report was generated
  const reportPath = path.join(process.cwd(), 'bundle-analyzer-report.html')
  if (fs.existsSync(reportPath)) {
    console.log('\n✅ Bundle analysis complete!')
    console.log(`📊 Report saved to: ${reportPath}`)
    console.log('   Open this file in your browser to view the analysis')
  }

  // Get build directory stats
  const buildDir = path.join(process.cwd(), '.next')
  if (fs.existsSync(buildDir)) {
    console.log('\n📈 Build Statistics:')
    
    // Get static directory size
    const staticDir = path.join(buildDir, 'static')
    if (fs.existsSync(staticDir)) {
      const staticSize = getDirSize(staticDir)
      console.log(`   Static assets: ${formatBytes(staticSize)}`)
    }

    // Get chunks info
    const chunksDir = path.join(staticDir, 'chunks')
    if (fs.existsSync(chunksDir)) {
      const chunks = fs.readdirSync(chunksDir)
        .filter(file => file.endsWith('.js'))
        .map(file => {
          const filePath = path.join(chunksDir, file)
          const stats = fs.statSync(filePath)
          return { name: file, size: stats.size }
        })
        .sort((a, b) => b.size - a.size)

      console.log(`   JavaScript chunks: ${chunks.length}`)
      console.log('   Top 5 largest chunks:')
      chunks.slice(0, 5).forEach((chunk, index) => {
        console.log(`     ${index + 1}. ${chunk.name}: ${formatBytes(chunk.size)}`)
      })
    }

    // Performance recommendations
    console.log('\n💡 Performance Recommendations:')
    
    const totalJSSize = getTotalJSSize(staticDir)
    if (totalJSSize > 500 * 1024) { // 500KB
      console.log('   ⚠️  Large JavaScript bundle detected')
      console.log('      Consider code splitting for better performance')
    }

    if (chunks && chunks.length > 20) {
      console.log('   ⚠️  Many chunks detected')
      console.log('      Consider consolidating similar functionality')
    }

    const largestChunk = chunks?.[0]
    if (largestChunk && largestChunk.size > 200 * 1024) { // 200KB
      console.log(`   ⚠️  Large chunk detected: ${largestChunk.name}`)
      console.log('      Consider splitting this chunk further')
    }

    console.log('   ✅ Use webpack-bundle-analyzer report for detailed analysis')
    console.log('   ✅ Consider lazy loading for admin and heavy components')
    console.log('   ✅ Optimize images using Next.js Image component')
  }

} catch (error) {
  console.error('❌ Bundle analysis failed:', error.message)
  process.exit(1)
}

function getDirSize(directory) {
  let size = 0
  
  function calculateSize(dir) {
    const files = fs.readdirSync(dir)
    
    files.forEach(file => {
      const filePath = path.join(dir, file)
      const stats = fs.statSync(filePath)
      
      if (stats.isDirectory()) {
        calculateSize(filePath)
      } else {
        size += stats.size
      }
    })
  }
  
  if (fs.existsSync(directory)) {
    calculateSize(directory)
  }
  
  return size
}

function getTotalJSSize(staticDir) {
  const chunksDir = path.join(staticDir, 'chunks')
  if (!fs.existsSync(chunksDir)) return 0

  return fs.readdirSync(chunksDir)
    .filter(file => file.endsWith('.js'))
    .reduce((total, file) => {
      const filePath = path.join(chunksDir, file)
      const stats = fs.statSync(filePath)
      return total + stats.size
    }, 0)
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}