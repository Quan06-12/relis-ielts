import jwt from 'jsonwebtoken'
import { ApiError } from '../utils/errors.js'

// Verify A's app JWT. Google sign-in and User persistence remain owned by A.
export function requireAuth(secret) {
  return (req, _res, next) => {
    try {
      const match = /^Bearer (\S+)$/.exec(req.get('Authorization') || '')
      if (!match) throw new Error('Missing bearer')
      const payload = jwt.verify(match[1], secret, { algorithms: ['HS256'] })
      if (!/^[a-f0-9]{24}$/.test(payload.userId || '')) throw new Error('Invalid user')
      req.userId = payload.userId
      next()
    } catch {
      next(new ApiError(401, 'UNAUTHENTICATED'))
    }
  }
}
