import { ZodError } from 'zod'

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) return res.status(400).json({ error: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') })
  if (err.code === 11000) return res.status(409).json({ error: 'Already exists', fields: Object.keys(err.keyValue || {}) })
  if (err.name === 'CastError') return res.status(404).json({ error: 'Not found' })
  if (err.status) return res.status(err.status).json({ error: err.message })
  console.error(err)
  res.status(500).json({ error: 'Something went wrong' })
}
