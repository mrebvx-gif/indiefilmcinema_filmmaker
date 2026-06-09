import { config } from './config'

const STREAM_API_URL = 'https://video.bunnycdn.com/library'
const STORAGE_API_URL = 'https://storage.bunnycdn.com'

export async function generateVideoUploadUrl(
  title: string
): Promise<{ bunnyVideoId: string; uploadUrl: string }> {
  // 1. Create a video object in the stream library
  const createResponse = await fetch(
    `${STREAM_API_URL}/${config.bunny.streamLibraryId}/videos`,
    {
      method: 'POST',
      headers: {
        AccessKey: config.bunny.streamAccessKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ title }),
    }
  )

  if (!createResponse.ok) {
    throw new Error('Failed to create BunnyCDN video object')
  }

  const videoData = await createResponse.json()
  const bunnyVideoId = videoData.guid

  // 2. The upload URL is a direct PUT endpoint
  const uploadUrl = `${STREAM_API_URL}/${config.bunny.streamLibraryId}/videos/${bunnyVideoId}`

  return { bunnyVideoId, uploadUrl }
}

export async function generateImageUploadUrl(
  filename: string,
  userId: string,
  purpose: 'poster' | 'thumbnail'
): Promise<{ objectName: string; uploadUrl: string; publicUrl: string }> {
  // Generate a unique path: films/{userId}/{timestamp}-{filename}
  const timestamp = Date.now()
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  const objectName = `films/${userId}/${purpose}-${timestamp}-${sanitizedFilename}`

  const uploadUrl = `${STORAGE_API_URL}/${config.bunny.storageZoneName}/${objectName}`
  const publicUrl = `${config.bunny.storageCdnUrl}/${objectName}`

  return { objectName, uploadUrl, publicUrl }
}

export async function confirmVideoUpload(
  bunnyVideoId: string
): Promise<{ confirmed: boolean; reason?: string }> {
  const response = await fetch(
    `${STREAM_API_URL}/${config.bunny.streamLibraryId}/videos/${bunnyVideoId}`,
    {
      method: 'GET',
      headers: {
        AccessKey: config.bunny.streamAccessKey,
        Accept: 'application/json',
      },
    }
  )

  if (!response.ok) {
    return { confirmed: false, reason: 'Video not found in BunnyCDN' }
  }

  const data = await response.json()
  
  // Status 0: Created, 1: Uploaded, 2: Processing, 3: Transcoding, 4: Finished, 5: Error, 6: UploadFailed
  if (data.status === 5 || data.status === 6) {
    return { confirmed: false, reason: 'Video upload failed or errored in BunnyCDN' }
  }

  // We consider it confirmed if it is at least status 1 (Uploaded)
  if (data.status >= 1 && data.status <= 4) {
    return { confirmed: true }
  }

  return { confirmed: false, reason: 'Video is still waiting for upload' }
}
