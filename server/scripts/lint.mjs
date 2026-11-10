import { ESLint } from 'eslint'
import { fileURLToPath } from 'node:url'
const cwd = fileURLToPath(new URL('../../', import.meta.url))
const eslint = new ESLint({ cwd })
const results = await eslint.lintFiles([
  'client/src',
  'client/test',
  'server/src',
  'server/test',
  'server/e2e',
  'server/scripts',
])
const formatter = await eslint.loadFormatter('stylish')
console.info(formatter.format(results) || 'JavaScript lint: no errors')
process.exitCode = results.some((r) => r.errorCount > 0) ? 1 : 0
