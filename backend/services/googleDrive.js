const { google } = require('googleapis')

const SCOPES = ['https://www.googleapis.com/auth/drive.file']

let driveClient = null

// Extracts a folder ID from either a bare ID or a full Google Drive URL.
const resolveFolderId = (value) => {
  if (!value) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null

  // If it is already a bare ID, return it.
  if (!/^https?:\/\//i.test(trimmed)) return trimmed

  // Otherwise try to extract the folder ID from a Drive URL.
  const match = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

const getDriveClient = () => {
  if (driveClient) return driveClient

  const clientEmail = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim()
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '')
    .replace(/\\n/g, '\n')
    .trim()

  if (!clientEmail || !privateKey) {
    throw new Error('Google service account credentials are not configured.')
  }

  const auth = new google.auth.JWT(clientEmail, null, privateKey, SCOPES)
  driveClient = google.drive({ version: 'v3', auth })
  return driveClient
}

const listDriveImages = async (folderId) => {
  const drive = getDriveClient()
  const resolved = resolveFolderId(folderId)
  const query = resolved
    ? `'${resolved}' in parents and trashed = false`
    : 'trashed = false'

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name, mimeType, size, createdTime, webContentLink, thumbnailLink)',
    pageSize: 100,
    supportsAllDrives: true,
  })

  return response.data.files || []
}

const findImageByName = async (folderId, name) => {
  const drive = getDriveClient()
  const resolved = resolveFolderId(folderId)
  const escaped = name.replace(/'/g, "\\'")
  const query = resolved
    ? `'${resolved}' in parents and name = '${escaped}' and trashed = false`
    : `name = '${escaped}' and trashed = false`

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name, mimeType, size, createdTime, webContentLink, thumbnailLink)',
    pageSize: 1,
    supportsAllDrives: true,
  })

  const files = response.data.files || []
  return files[0] || null
}

const uploadFile = async (fileBuffer, filename, mimeType, folderId) => {
  const drive = getDriveClient()
  const resolved = resolveFolderId(folderId)
  const fileMetadata = { name: filename }
  if (resolved) fileMetadata.parents = [resolved]

  const response = await drive.files.create({
    fields: 'id, name, mimeType, size, createdTime, webContentLink, thumbnailLink',
    media: {
      mimeType,
      body: fileBuffer,
    },
    supportsAllDrives: true,
  })

  const fileId = response.data.id

  // Make the file viewable by anyone with the link
  try {
    await drive.permissions.create({
      fileId,
      permission: { type: 'anyone', role: 'reader' },
      supportsAllDrives: true,
    })
  } catch {
    // Non-fatal: the file still exists, just not publicly shared.
  }

  return {
    _id: fileId,
    name: response.data.name,
    mimeType: response.data.mimeType,
    size: response.data.size,
    createdTime: response.data.createdTime,
    webContentLink: response.data.webContentLink,
    thumbnailLink: response.data.thumbnailLink,
  }
}

const deleteFile = async (fileId) => {
  const drive = getDriveClient()
  await drive.files.delete({ fileId, supportsAllDrives: true })
}

const getFile = async (fileId) => {
  const drive = getDriveClient()
  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, createdTime, webContentLink, thumbnailLink',
    supportsAllDrives: true,
  })
  return response.data
}

const isConfigured = () =>
  Boolean((process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim() && (process.env.GOOGLE_PRIVATE_KEY || '').trim())

module.exports = {
  getDriveClient,
  listDriveImages,
  findImageByName,
  uploadFile,
  deleteFile,
  getFile,
  isConfigured,
  resolveFolderId,
}