import { Router } from 'express'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// Public API documentation, read straight from the contract in docs/api/openapi.yaml.
// GET /api/docs               → Swagger UI page (the UI itself is loaded from a CDN)
// GET /api/docs/openapi.yaml  → the raw contract
const CONTRACT_PATH = fileURLToPath(new URL('../../../docs/api/openapi.yaml', import.meta.url))
const SWAGGER_UI = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14'

const PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Relis API documentation</title>
  <link rel="stylesheet" href="${SWAGGER_UI}/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${SWAGGER_UI}/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({ url: 'docs/openapi.yaml', dom_id: '#swagger-ui', deepLinking: true })
  </script>
</body>
</html>`

const router = Router()

router.get('/', (request, response) => {
  // "/api/docs" and "/api/docs/" both work: the spec URL is resolved against "/api/"
  if (request.originalUrl.endsWith('/')) return response.redirect(301, '/api/docs')
  response.type('html').send(PAGE)
})

router.get('/openapi.yaml', async (request, response) => {
  const contract = await readFile(CONTRACT_PATH, 'utf8')
  response.type('text/yaml').send(contract)
})

export default router
