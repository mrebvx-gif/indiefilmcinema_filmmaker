import { z } from 'zod'

const GENRES = [
  'Horror', 'Drama', 'Documentary', 'Comedy', 'Thriller',
  'Action', 'Sci-Fi', 'Romance', 'Animation', 'Music Video',
  'Short Film', 'Other',
] as const

const MARKET_INTERESTS = [
  'FESTIVAL_LOCAL',
  'FESTIVAL_INTERNATIONAL',
  'THEATRICAL',
  'STREAMING_VOD',
  'EDUCATIONAL',
] as const

export const FilmSubmissionSchema = z.object({
  filmTitle: z.string().min(1).max(500),
  logline: z.string().min(20, 'Logline must be at least 20 characters').max(1000),
  runningTimeSeconds: z.number().int().min(1, 'Running time is required'),
  primaryGenre: z.enum(GENRES),
  countryOfOrigin: z.string().min(1).max(100),
  targetCountries: z.array(z.string()).default([]),
  targetReleaseYear: z.number().int().min(2024).max(2035).optional().nullable(),
  directorName: z.string().min(1).max(255),
  producerName: z.string().max(255).optional().nullable(),
  writerName: z.string().max(255).optional().nullable(),
  cinematographerName: z.string().max(255).optional().nullable(),
  marketInterests: z.array(z.enum(MARKET_INTERESTS)).default([]),
  narrativeScale: z.number().int().min(1).max(7),
  posterBunnyUrl: z.string().url().optional().nullable(),
  posterBunnyObject: z.string().optional().nullable(),
  thumbnailBunnyUrl: z.string().url('Thumbnail is required'),
  thumbnailBunnyObject: z.string().min(1),
  youtubeTrailerUrl: z.string().refine(
    (url) => /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(url),
    { message: 'Must be a valid YouTube URL' }
  ),
  videoBunnyVideoId: z.string().min(1, 'Video upload is required'),
  videoBunnyLibraryId: z.string().min(1),
})

export type FilmSubmissionInput = z.infer<typeof FilmSubmissionSchema>
export { GENRES, MARKET_INTERESTS }
