import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config.js'
import routes from './routes/index.js'
import { errorHandler } from './middleware/error.js'

export function createApp() {
  const app = express()
  app.set('trust proxy', 1) // behind Vercel's edge: use the real client IP for rate limiting
  app.use(helmet())
  app.use(cors({ origin: config.clientOrigin }))
  app.use(express.json({ limit: '200kb' }))
  app.use('/api', routes)
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }))
  app.use(errorHandler)
  return app
}
