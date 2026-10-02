// Vercel serverless entry: one function serves the whole Express API.
import { createApp } from '../src/app.js'
import { connectDB } from '../src/db.js'

const app = createApp()
let ready // reuse the MongoDB connection across warm invocations

export default async function handler(req, res) {
  try {
    ready ??= connectDB()
    await ready
  } catch (e) {
    ready = undefined
    console.error('DB connection failed:', e.message)
    return res.status(503).json({ error: 'Database unavailable' })
  }
  return app(req, res)
}
