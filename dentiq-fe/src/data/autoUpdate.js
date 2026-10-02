// Keeps installed copies current: checks for a new deploy on open, on return to the app and every 30 min.
// The reload waits until it is safe (no form open), so nothing typed is lost.
const CHECK_EVERY = 30 * 60e3

export function startAutoUpdate(isSafe) {
  if (!import.meta.env.PROD) return () => {}
  let pending = false

  const apply = () => {
    if (!pending || !isSafe()) return
    try { sessionStorage.setItem('dentiq-updated', '1') } catch { /* storage unavailable */ }
    location.reload()
  }

  const check = async () => {
    try {
      navigator.serviceWorker?.getRegistration().then((r) => r?.update()).catch(() => {})
      const { build } = await fetch('/version.json', { cache: 'no-store' }).then((r) => r.json())
      if (build && build !== import.meta.env.VITE_BUILD_ID) { pending = true; apply() }
    } catch { /* offline: try again later */ }
  }

  const onVisible = () => { if (document.visibilityState === 'visible') check() }
  check()
  const timer = setInterval(check, CHECK_EVERY)
  document.addEventListener('visibilitychange', onVisible)
  const retry = setInterval(apply, 5000) // once pending, reload as soon as the doctor is idle
  return () => { clearInterval(timer); clearInterval(retry); document.removeEventListener('visibilitychange', onVisible) }
}

// True once, right after an automatic update reload
export function justUpdated() {
  try { const v = sessionStorage.getItem('dentiq-updated'); sessionStorage.removeItem('dentiq-updated'); return v === '1' } catch { return false }
}
