// fetch con tiempo límite. Devuelve { res } o { timedOut } o { failed }; nunca propaga el mensaje del error
// (puede contener URL con token).
export async function timedFetch(fetchFn, url, init, timeoutMs) {
  const ctl = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    ctl.abort()
  }, timeoutMs)
  try {
    return { res: await fetchFn(url, { ...init, signal: ctl.signal }) }
  } catch {
    return timedOut ? { timedOut: true } : { failed: true }
  } finally {
    clearTimeout(timer)
  }
}

export async function readJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}
