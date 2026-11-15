// Reads settings from environment variables in one place.
// Locally they come from server/.env (loaded by `npm run dev`); on Render, from the dashboard.

function required(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Copy server/.env.example to server/.env and fill it in.`)
  }
  return value
}

export function loadConfig() {
  return {
    port: Number(process.env.PORT) || 5000,
    mongodbUri: required('MONGODB_URI'),
    // Checked here so the server refuses to start without them (sign-in would fail anyway)
    googleClientId: required('GOOGLE_CLIENT_ID'),
    jwtSecret: required('JWT_SECRET'),
    clientUrl: parseClientUrls(process.env.CLIENT_URL),
  }
}

// CLIENT_URL may list several sites separated by commas (e.g. the own domain and the vercel.app address).
// One site stays a plain string, which is what the cors package expects in that case.
export function parseClientUrls(value) {
  const urls = String(value || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean)
  return urls.length === 1 ? urls[0] : urls
}
