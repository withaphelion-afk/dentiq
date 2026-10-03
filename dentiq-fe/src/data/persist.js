// Page addresses (so a refresh stays put) and form drafts (so a refresh/close doesn't lose typing)

const PAGES = ['patients', 'calendar', 'reports', 'settings']

export function parseRoute(path = location.pathname) {
  const [, page, id] = path.split('/')
  return PAGES.includes(page) ? { page, profileId: page === 'patients' && id ? id : null } : { page: 'today', profileId: null }
}
export const routePath = (page, profileId) => (page === 'today' ? '/' : `/${page}${profileId ? `/${profileId}` : ''}`)

const DRAFT_TTL = 24 * 36e5
const store = (s) => ({
  get: (k) => { try { return JSON.parse(s.getItem(k)) } catch { return null } },
  set: (k, v) => { try { s.setItem(k, JSON.stringify(v)) } catch { /* storage unavailable */ } },
  del: (k) => { try { s.removeItem(k) } catch { /* storage unavailable */ } },
})
const local = store(localStorage), session = store(sessionStorage)

// Drafts live on this device for 24h, then expire
export const loadDraft = (key) => { const d = local.get(`dentiq-draft-${key}`); return d && Date.now() - d.at < DRAFT_TTL ? d.data : null }
export const saveDraft = (key, data) => local.set(`dentiq-draft-${key}`, { at: Date.now(), data })
export const clearDraft = (key) => local.del(`dentiq-draft-${key}`)

// Which form was open (per tab), restored after a refresh
export const openSheetStore = { get: () => session.get('dentiq-sheet'), set: (v) => (v ? session.set('dentiq-sheet', v) : session.del('dentiq-sheet')) }

// Startup animation once per app launch, not on refresh or auto-update reload
export const splashSeen = { get: () => session.get('dentiq-started') === 1, set: () => session.set('dentiq-started', 1) }
