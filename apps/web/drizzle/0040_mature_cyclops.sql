ALTER TABLE "f_user" ADD COLUMN "onboardingCompleted" boolean DEFAULT false NOT NULL;
UPDATE "f_user" SET "onboardingCompleted" = true;