import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { HttpError } from './error.js'

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer /, '')
  try {
    req.user = jwt.verify(token, config.jwtSecret)
    next()
  } catch {
    res.status(401).json({ error: 'Please log in' })
  }
}

// Guest sessions can look but never change anything
export function blockGuestWrites(req, _res, next) {
  if (req.user?.role === 'guest' && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next(new HttpError(403, 'Guest access is read-only'))
  next()
}

export const signGuestToken = () => jwt.sign({ sub: 'guest', username: 'guest', role: 'guest' }, config.jwtSecret, { expiresIn: '1h' })

export const signToken = (user) => jwt.sign({ sub: String(user._id), username: user.username }, config.jwtSecret, { expiresIn: '6h' }) // session ends after 6 hours
