import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware({
    publicRoutes: ["/", "/photo/:id"], // allow public access to gallery & photo pages
    ignoreRoutes: ["/api/(.*)"], // skip protecting backend routes
});

export const config = {
    matcher: ["/((?!_next|.*\\..*).*)"], // match everything except static files
}