import { useState } from 'react'
import { authFetch } from '@/lib/auth-client'

interface UploadState {
  progress: number
  isUploading: boolean
  error: string | null
  isSuccess: boolean
}

export function useUploader() {
  const [state, setState] = useState<UploadState>({
    progress: 0,
    isUploading: false,
    error: null,
    isSuccess: false,
  })

  const uploadVideo = async (file: File) => {
    setState({ progress: 0, isUploading: true, error: null, isSuccess: false })
    try {
      // 1. Get Upload URL
      const urlRes = await authFetch('/api/uploads/video-url', {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, fileSizeBytes: file.size })
      })
      
      if (!urlRes.ok) throw new Error('Failed to get upload URL')
      const { bunnyVideoId, uploadUrl, bunnyLibraryId, headers } = await urlRes.json()

      // 2. Direct PUT to BunnyCDN using XMLHttpRequest for progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl, true)
        
        xhr.setRequestHeader('AccessKey', headers.AccessKey)
        xhr.setRequestHeader('Content-Type', headers['Content-Type'])

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100
            setState(prev => ({ ...prev, progress: percentComplete }))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error('Upload failed'))
          }
        }

        xhr.onerror = () => reject(new Error('Upload error'))
        xhr.send(file)
      })

      // 3. Confirm Video
      const confirmRes = await authFetch('/api/uploads/confirm-video', {
        method: 'POST',
        body: JSON.stringify({ bunnyVideoId })
      })

      if (!confirmRes.ok) throw new Error('Failed to confirm upload')

      setState({ progress: 100, isUploading: false, error: null, isSuccess: true })
      return { bunnyVideoId, bunnyLibraryId }
    } catch (err: any) {
      setState({ progress: 0, isUploading: false, error: err.message, isSuccess: false })
      throw err
    }
  }

  const uploadImage = async (file: File, purpose: 'poster' | 'thumbnail') => {
    setState({ progress: 0, isUploading: true, error: null, isSuccess: false })
    try {
      const urlRes = await authFetch('/api/uploads/image-url', {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, fileSizeBytes: file.size, purpose })
      })

      if (!urlRes.ok) throw new Error('Failed to get upload URL')
      const { objectName, uploadUrl, publicUrl, headers } = await urlRes.json()

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl, true)
        
        xhr.setRequestHeader('AccessKey', headers.AccessKey)
        xhr.setRequestHeader('Content-Type', headers['Content-Type'])

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100
            setState(prev => ({ ...prev, progress: percentComplete }))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error('Upload failed'))
        }

        xhr.onerror = () => reject(new Error('Upload error'))
        xhr.send(file)
      })

      setState({ progress: 100, isUploading: false, error: null, isSuccess: true })
      return { objectName, publicUrl }
    } catch (err: any) {
      setState({ progress: 0, isUploading: false, error: err.message, isSuccess: false })
      throw err
    }
  }

  return { ...state, uploadVideo, uploadImage }
}
