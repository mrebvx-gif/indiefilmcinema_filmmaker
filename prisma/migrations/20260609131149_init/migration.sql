-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(255) NOT NULL,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "lsSubscriptionId" VARCHAR(255) NOT NULL,
    "lsCustomerId" VARCHAR(255) NOT NULL,
    "lsVariantId" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL,
    "currentPeriodEnd" TIMESTAMPTZ,
    "cancelledAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "usedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "usedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "filmakerId" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    "filmTitle" VARCHAR(500) NOT NULL,
    "logline" TEXT NOT NULL,
    "runningTimeSeconds" INTEGER NOT NULL,
    "primaryGenre" VARCHAR(100) NOT NULL,
    "countryOfOrigin" VARCHAR(100) NOT NULL,
    "targetCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetReleaseYear" SMALLINT,
    "directorName" VARCHAR(255) NOT NULL,
    "producerName" VARCHAR(255),
    "writerName" VARCHAR(255),
    "cinematographerName" VARCHAR(255),
    "marketInterests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "narrativeScale" SMALLINT NOT NULL,
    "posterBunnyUrl" VARCHAR(1000),
    "posterBunnyObject" VARCHAR(500),
    "thumbnailBunnyUrl" VARCHAR(1000) NOT NULL,
    "thumbnailBunnyObject" VARCHAR(500) NOT NULL,
    "youtubeTrailerUrl" VARCHAR(500) NOT NULL,
    "videoBunnyVideoId" VARCHAR(255) NOT NULL,
    "videoBunnyLibraryId" VARCHAR(255) NOT NULL,
    "submittedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "film_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_lsSubscriptionId_key" ON "subscriptions"("lsSubscriptionId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_token_idx" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "film_submissions_filmakerId_idx" ON "film_submissions"("filmakerId");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_submissions" ADD CONSTRAINT "film_submissions_filmakerId_fkey" FOREIGN KEY ("filmakerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
