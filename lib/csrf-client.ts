/**
 * Client-side helper for the double-submit CSRF pattern.
 *
 * The middleware requires every state-changing /api request to carry an
 * X-CSRF-Token header matching the httpOnly __csrf_token cookie. This
 * helper fetches a fresh token (which also sets the cookie) and attaches
 * the header — use it instead of bare fetch() for all form submissions.
 */
export async function fetchWithCsrf(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const tokenResponse = await fetch('/api/csrf-token')
  if (!tokenResponse.ok) {
    throw new Error('Could not initialize a secure session. Please refresh the page and try again.')
  }
  const { token } = await tokenResponse.json()

  return fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      'X-CSRF-Token': token,
    },
  })
}
