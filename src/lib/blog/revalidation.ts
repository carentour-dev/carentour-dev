// Hobby deployments cannot rely on frequent Vercel cron jobs, so blog
// publication surfaces refresh on a short ISR cadence instead.
export const BLOG_SURFACE_REVALIDATE_SECONDS = 60;

// Discovery artifacts can update a bit less aggressively while still picking
// up newly published scheduled posts quickly.
export const BLOG_DISCOVERY_REVALIDATE_SECONDS = 300;
