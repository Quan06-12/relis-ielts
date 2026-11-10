export function readConfig(env = process.env) {
  const port = Number(env.PORT || 5000)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT')
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32)
    throw new Error('JWT_SECRET must contain at least 32 characters')
  if (!env.MONGODB_URI?.startsWith('mongodb')) throw new Error('MONGODB_URI is required')
  const origin = new URL(env.CLIENT_URL || 'http://localhost:5173')
  if (
    !['http:', 'https:'].includes(origin.protocol) ||
    origin.origin !== (env.CLIENT_URL || 'http://localhost:5173')
  ) {
    throw new Error('CLIENT_URL must be an HTTP origin without trailing slash')
  }
  if (env.NODE_ENV === 'production' && env.DEV_FIXTURES === 'true')
    throw new Error('Dev fixtures are forbidden in production')
  return { port, mongoUri: env.MONGODB_URI, jwtSecret: env.JWT_SECRET, clientUrl: origin.origin }
}
