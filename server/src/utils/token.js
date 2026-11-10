import jwt from 'jsonwebtoken'

// Our own login token (JWT). It only stores the user id and expires after 7 days.
const TOKEN_LIFETIME = '7d'

export function createToken(userId) {
  return jwt.sign({ userId: String(userId) }, process.env.JWT_SECRET, { expiresIn: TOKEN_LIFETIME })
}

// Returns the user id, or null if the token is wrong or expired.
export function readUserIdFromToken(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    return payload.userId
  } catch {
    return null
  }
}
