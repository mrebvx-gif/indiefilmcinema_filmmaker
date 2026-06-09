import { z } from 'zod'

export const VideoUploadUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  fileSizeBytes: z.number().int().positive(),
})

export const ImageUploadUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  fileSizeBytes: z.number().int().positive().max(10 * 1024 * 1024, 'Max 10MB'),
  purpose: z.enum(['poster', 'thumbnail']),
})

export const ConfirmVideoSchema = z.object({
  bunnyVideoId: z.string().min(1),
})
