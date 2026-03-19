const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

async function requestJson(path, options = {}) {
  const { headers, ...restOptions } = options
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...restOptions,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail ?? data.message ?? 'Request failed.')
  }

  return data
}

export function getJson(path) {
  return requestJson(path, {
    method: 'GET',
  })
}

export function postJson(path, payload) {
  return requestJson(path, {
    method: 'POST',
    body: payload === undefined ? undefined : JSON.stringify(payload),
  })
}
