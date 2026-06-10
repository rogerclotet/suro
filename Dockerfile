FROM node:25.1 AS base

# Install pnpm
RUN npm install -g pnpm@latest-10

# Install dependencies only when needed.
# Build context is the monorepo root. Copy the workspace manifests first so the
# install layer caches independently of source changes.
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
# NOTE: when packages/* or other apps gain their own package.json and the web
# app depends on them, COPY those manifests here too before installing.
RUN \
    if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile --filter web...; \
    else echo "Lockfile not found." && exit 1; \
    fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Allow callers (e.g. preview CI) to skip runtime env validation at build time.
ARG SKIP_ENV_VALIDATION=0
ENV SKIP_ENV_VALIDATION=$SKIP_ENV_VALIDATION
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time.
ARG NEXT_PUBLIC_CONVEX_URL=""
ENV NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_POSTHOG_KEY=""
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST=""
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST
# Build-time only: upload client source maps to PostHog so production stack
# traces are readable. Unset for preview builds, which skip the upload.
ARG POSTHOG_API_KEY=""
ENV POSTHOG_API_KEY=$POSTHOG_API_KEY
ARG POSTHOG_ENV_ID=""
ENV POSTHOG_ENV_ID=$POSTHOG_ENV_ID

RUN pnpm --filter web build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# next.config sets outputFileTracingRoot to the monorepo root, so the standalone
# bundle preserves the workspace structure: apps/web/server.js plus a top-level
# node_modules. Lay it down at /app, then add static + public under apps/web.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Set the correct permission for prerender cache
RUN mkdir -p apps/web/.next
RUN chown nextjs:nodejs apps/web/.next

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js lives under apps/web in the standalone output; run from there.
WORKDIR /app/apps/web

# server.js is created by next build from the standalone output. Data, auth,
# and storage all run on Convex now, so there's no migrate/seed step — the
# container just serves the app.
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
ENTRYPOINT ["node", "server.js"]
