// CONVEX_SITE_URL is a system variable that Convex sets on every deployment; it is
// not a user-declared variable in convex.config.ts, so the typed `env` object the
// lint rule suggests does not cover it.
// eslint-disable-next-line @convex-dev/no-process-env
const siteUrl = process.env.CONVEX_SITE_URL
if (!siteUrl) {
  throw new Error('CONVEX_SITE_URL environment variable is required')
}

export default {
  providers: [
    {
      domain: siteUrl,
      applicationID: 'convex',
    },
  ],
}
