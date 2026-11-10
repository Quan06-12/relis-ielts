import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import YAML from 'yaml'

test('API contract parses with unique keys and all internal schema references resolve', () => {
  const doc = YAML.parse(
    readFileSync(new URL('../../docs/api/openapi.yaml', import.meta.url), 'utf8'),
    { uniqueKeys: true },
  )
  assert.equal(doc.openapi, '3.1.0')
  function walk(value) {
    if (!value || typeof value !== 'object') return
    if (value.$ref?.startsWith('#/'))
      assert.ok(
        value.$ref
          .slice(2)
          .split('/')
          .reduce((node, key) => node?.[key], doc),
        value.$ref,
      )
    Object.values(value).forEach(walk)
  }
  walk(doc)
  for (const path of [
    '/attempts',
    '/attempts/{attemptId}/review',
    '/dashboard',
    '/vocab-sets',
    '/vocab-sets/{setId}',
  ])
    assert.ok(doc.paths[path])
  const render = YAML.parse(readFileSync(new URL('../../render.yaml', import.meta.url), 'utf8'))
  assert.equal(render.services[0].rootDir, 'server')
  assert.equal(render.services[0].healthCheckPath, '/api/health')
  assert.equal(render.services[0].startCommand, 'npm start')
  assert.equal(render.services[0].envVars.find((entry) => entry.key === 'NODE_VERSION').value, '22')
  const vercel = JSON.parse(
    readFileSync(new URL('../../client/vercel.json', import.meta.url), 'utf8'),
  )
  assert.equal(vercel.rewrites[0].destination, '/index.html')
})
