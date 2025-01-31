"use client"
import { SignUp } from "@clerk/nextjs";

export default function() {
    return (
        <div className="min-h-[90vh] flex items-center justify-center p-4">
            <SignUp 
                routing="path" 
                path="/sign-up" 
                signInUrl="/sign-in"
                redirectUrl="/welcome"
            />
        </div>
    )
}
 
