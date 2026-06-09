// Stub — implemented in Phase 3
export async function generateVideoUploadUrl(
  _filename: string
): Promise<{ bunnyVideoId: string; uploadUrl: string }> {
  throw new Error('Not implemented')
}

export async function generateImageUploadUrl(
  _filename: string,
  _userId: string,
  _purpose: 'poster' | 'thumbnail'
): Promise<{ objectName: string; uploadUrl: string; publicUrl: string }> {
  throw new Error('Not implemented')
}

export async function confirmVideoUpload(
  _bunnyVideoId: string
): Promise<{ confirmed: boolean; reason?: string }> {
  throw new Error('Not implemented')
}
