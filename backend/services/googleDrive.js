const { google } = require('googleapis')

const SCOPES = ['https://www.googleapis.com/auth/drive.file']

let driveClient = null

const getDriveClient = () => {
  if (driveClient) return driveClient

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

  if (!clientEmail || !privateKey) {
    throw new Error('Google service account credentials are not configured.')
  }

  const auth = new google.auth.JWT(clientEmail, null, privateKey, SCOPES)
  driveClient = google.drive({ version: 'v3', auth })
  return driveClient
}

const listDriveImages = async (folderId) => {
  const drive = getDriveClient()
  const query = folderId
    ? `'${folderId}' in parents and trashed = false`
    : 'trashed = false'

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name, mimeType, size, createdTime)',
    pageSize: 100,
    supportsAllDrives: true,
  })

  return response.data.files || []
}

const findImageByName = async (folderId, name) => {
  const drive = getDriveClient()
  const escaped = name.replace(/'/g, "\\'")
  const query = folderId
    ? `'${folderId}' in parents and name = '${escaped}' and trashed = false`
    : `name = '${escaped}' and trashed = false`

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name, mimeType, size, createdTime)',
    pageSize: 1,
    supportsAllDrives: true,
  })

  const files = response.data.files || []
  return files[0] || null
}

const uploadFile = async (fileBuffer, filename, mimeType, folderId) => {
  const drive = getDriveClient()
  const fileMetadata = { name: filename }
  if (folderId) fileMetadata.parents = [folderId]

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
  Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY)

module.exports = {
  getDriveClient,
  listDriveImages,
  findImageByName,
  uploadFile,
  deleteFile,
  getFile,
  isConfigured,
}