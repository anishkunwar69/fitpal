"use client"
import { SignIn } from "@clerk/nextjs";

export default function() {
    return (
        <div className="min-h-[90vh] flex items-center justify-center p-4">
            <SignIn 
                routing="path" 
                path="/sign-in" 
                signUpUrl="/sign-up"
                redirectUrl="/welcome"
            />
        </div>
    )
}
 
