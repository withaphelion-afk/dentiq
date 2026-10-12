import { useEffect, useState } from 'react'
import { api } from '../data/api'

// Photos are private: they are downloaded with the login header and shown from a local object URL.
const cache = new Map() // photo id -> Promise<object URL>

export const seedPhoto = (id, url) => cache.set(id, Promise.resolve(url)) // reuse the capture we already have
export const loadPhotoUrl = (id) => {
  if (!cache.has(id)) cache.set(id, api.blob(`/photos/${id}/file`).then(URL.createObjectURL).catch((e) => { cache.delete(id); throw e }))
  return cache.get(id)
}

export default function PhotoImage({ id, className = '', alt = '', ...rest }) {
  const [state, setState] = useState({ id, url: null, failed: false })
  useEffect(() => {
    let live = true
    loadPhotoUrl(id).then((url) => live && setState({ id, url, failed: false })).catch(() => live && setState({ id, url: null, failed: true }))
    return () => { live = false }
  }, [id])
  const cur = state.id === id ? state : { url: null, failed: false }
  if (cur.failed) return <div className={`grid place-items-center bg-bg text-xs text-muted ${className}`}>Unavailable</div>
  if (!cur.url) return <div className={`shimmer ${className}`} />
  return <img src={cur.url} alt={alt} className={className} draggable={false} {...rest} />
}
