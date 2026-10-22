const path = require('path')
const fs = require('fs')

const envPath = path.resolve(__dirname, '../.env')

// Loads backend/.env once, without clobbering variables that are already set.
// Vercel and other runtimes inject real secrets through the environment, so
// anything already defined wins over the local file.
const loadEnv = () => {
  if (process.env.NODE_ENV === 'production') return

  if (!fs.existsSync(envPath)) return

  const contents = fs.readFileSync(envPath, 'utf8')

  contents.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) return

    const key = trimmed.slice(0, separatorIndex).trim()
    if (!key || process.env[key] !== undefined) return

    let value = trimmed.slice(separatorIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  })
}

loadEnv()

const DEV_FALLBACK_SECRET = 'minifour-super-secure-dev-secret-change-me'

// Resolves the JWT signing secret. Production must provide an explicit secret,
// otherwise tokens would be signed with a value that is public in the repository.
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET
  if (secret && secret.trim()) return secret.trim()

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production.')
  }

  return DEV_FALLBACK_SECRET
}

module.exports = { getJwtSecret, loadEnv }
