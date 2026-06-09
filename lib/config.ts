export const config = {
  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  bunny: {
    apiKey: process.env.BUNNY_API_KEY!,
    streamLibraryId: process.env.BUNNY_STREAM_LIBRARY_ID!,
    streamAccessKey: process.env.BUNNY_STREAM_ACCESS_KEY!,
    storageZoneName: process.env.BUNNY_STORAGE_ZONE_NAME!,
    storageAccessKey: process.env.BUNNY_STORAGE_ACCESS_KEY!,
    storageCdnUrl: process.env.BUNNY_STORAGE_CDN_URL!,
  },
  lemonSqueezy: {
    apiKey: process.env.LEMON_SQUEEZY_API_KEY!,
    storeId: process.env.LEMON_SQUEEZY_STORE_ID!,
    variantId: process.env.LEMON_SQUEEZY_VARIANT_ID!,
    webhookSecret: process.env.LS_WEBHOOK_SECRET!,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY!,
    from: process.env.EMAIL_FROM!,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL!,
  },
}
