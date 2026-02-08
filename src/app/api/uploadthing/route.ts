import { createRouteHandler } from "uploadthing/next";

import { ourFileRouter } from "./core";

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
    router: ourFileRouter,
});

// Vercel Serverless Config
export const maxDuration = 60; // 60 seconds (Hobby limit) or 300 (Pro)
export const dynamic = 'force-dynamic';
