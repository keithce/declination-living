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
