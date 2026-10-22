const { randomUUID } = require('crypto')

const environment = process.env.MTN_MOMO_ENVIRONMENT || 'sandbox'
const baseUrl = (process.env.MTN_MOMO_BASE_URL || (
  environment === 'production'
    ? 'https://proxy.momoapi.mtn.com'
    : 'https://sandbox.momodeveloper.mtn.com'
)).replace(/\/+$/, '')
const targetEnvironment = process.env.MTN_MOMO_TARGET_ENVIRONMENT || (environment === 'sandbox' ? 'sandbox' : '')
const currency = environment === 'sandbox' ? 'EUR' : (process.env.MTN_MOMO_CURRENCY || 'RWF')
const requestTimeoutMs = Number(process.env.MTN_MOMO_TIMEOUT_MS || 15000)

let cachedToken
let tokenExpiresAt = 0

const isConfigured = () => Boolean(
  process.env.MTN_MOMO_SUBSCRIPTION_KEY &&
  process.env.MTN_MOMO_API_USER &&
  process.env.MTN_MOMO_API_KEY &&
  targetEnvironment
)

const readResponse = async (response) => {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

const getAccessToken = async () => {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken

  const credentials = Buffer.from(`${process.env.MTN_MOMO_API_USER}:${process.env.MTN_MOMO_API_KEY}`).toString('base64')
  const response = await fetch(`${baseUrl}/collection/token/`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY,
      'X-Target-Environment': targetEnvironment,
    },
    signal: AbortSignal.timeout(requestTimeoutMs),
  })
  const data = await readResponse(response)

  if (!response.ok || !data?.access_token) {
    throw new Error(data?.message || 'MTN MoMo authentication failed.')
  }

  cachedToken = data.access_token
  tokenExpiresAt = Date.now() + Math.max(Number(data.expires_in || 60) - 30, 1) * 1000
  return cachedToken
}

const momoRequest = async (endpoint, options = {}) => {
  const accessToken = await getAccessToken()
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY,
      'X-Target-Environment': targetEnvironment,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    signal: AbortSignal.timeout(requestTimeoutMs),
  })
  const data = await readResponse(response)

  if (!response.ok) {
    throw new Error(data?.message || `MTN MoMo request failed (${response.status}).`)
  }

  return { data, response }
}

const normalizePhoneNumber = (value) => String(value || '').replace(/[\s()+-]/g, '')
const isValidPhoneNumber = (value) => /^\d{8,15}$/.test(normalizePhoneNumber(value))

const requestToPay = async ({ amount, phoneNumber, externalId, referenceId = randomUUID() }) => {
  const normalizedPhone = normalizePhoneNumber(phoneNumber)
  if (!isValidPhoneNumber(phoneNumber)) {
    throw new Error('Enter a valid mobile number with its country code.')
  }

  await momoRequest('/collection/v1_0/requesttopay', {
    method: 'POST',
    headers: {
      'X-Reference-Id': referenceId,
    },
    body: JSON.stringify({
      amount: Number(amount).toFixed(2),
      currency,
      externalId: String(externalId),
      payer: {
        partyIdType: 'MSISDN',
        partyId: normalizedPhone,
      },
      payerMessage: 'Minifour order payment',
      payeeNote: `Order ${String(externalId).slice(-8)}`,
    }),
  })

  return referenceId
}

const getRequestToPayStatus = async (referenceId) => {
  const { data } = await momoRequest(`/collection/v1_0/requesttopay/${encodeURIComponent(referenceId)}`)
  return data
}

module.exports = {
  getRequestToPayStatus,
  isValidPhoneNumber,
  isConfigured,
  normalizePhoneNumber,
  requestToPay,
}