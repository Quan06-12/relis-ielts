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
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  }
}
