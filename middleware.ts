// Middleware to ensure nodejs_compat is enabled for Appwrite SDK
// This file is required for Cloudflare Pages to recognize that Node.js APIs are needed

export function middleware() {
  // This middleware runs on all routes in the edge runtime
  // Its presence signals to Cloudflare that Node.js compatibility is required
  return undefined;
}

export const config = {
  matcher: ['/:path*'],
};
