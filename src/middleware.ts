import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';

export default clerkMiddleware(async(auth,req)=>{
  // if(req.url.includes("/api/v1/")){
  //   const authHeader = req.headers.get("authorization");
  //   if(!authHeader){
  //     return NextResponse.json(
  //       {
  //         message: "Missing authorization token",
  //         success: false,
  //       },
  //       {
  //         status: 401,
  //       }
  //     );
  //   }

  //   const [bearer, token] = authHeader.split(" ");
  //   if(bearer != "Bearer" || !token){
  //     return NextResponse.json(
  //       {
  //         message: "Invalid token format. Bearer <TOKEN> format is needed",
  //         success: false,
  //       },
  //       {
  //         status: 401,
  //       }
  //     ); 
  //   }

  //   const requestHeaders = new Headers(req.headers);
  //   requestHeaders.set("token",token);
  //   return NextResponse.next({
  //     request: {
  //       headers: requestHeaders,
  //     },
  //   });
  // }
  // return NextResponse.next();
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
