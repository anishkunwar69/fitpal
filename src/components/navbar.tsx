import React from "react";
import MaxWidthWrapper from "./max-width-wrapper";
import { currentUser } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import Link from "next/link";
import { Dumbbell, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";

async function Navbar() {
  const isUserLoggedIn = await currentUser();

  const NavItems = () => (
    <>
      {isUserLoggedIn ? (
        <>
          <Button
            asChild
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 rounded-full shadow-sm hover:shadow-md transition-all w-full md:w-auto"
          >
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <div className="w-full md:w-px h-px md:h-6 bg-orange-200/50 my-2 md:my-0" />
          <SignOutButton>
            <Button
              variant="ghost"
              className="font-medium hover:bg-orange-100/50 text-gray-700 hover:text-orange-600 transition-colors rounded-full px-6 w-full md:w-auto"
            >
              Sign Out
            </Button>
          </SignOutButton>
        </>
      ) : (
        <>
          <Button
            asChild
            variant="ghost"
            className="font-medium hover:bg-orange-100/50 text-gray-700 hover:text-orange-600 transition-colors rounded-full px-6 w-full md:w-auto"
          >
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button
            asChild
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 rounded-full shadow-sm hover:shadow-md transition-all w-full md:w-auto"
          >
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </>
      )}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 bg-transparent">
      <div className="absolute inset-0 bg-orange-50/50 backdrop-blur-sm border-b border-orange-100/30" />
      <MaxWidthWrapper>
        <div className="relative w-full flex justify-between items-center h-16 px-4">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="p-2 rounded-lg bg-orange-100/50 group-hover:bg-orange-100 transition-colors">
              <Dumbbell className="w-5 h-5 text-orange-500" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
              Fit<span className="text-orange-500">Pal</span>
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-3">
            <NavItems />
          </div>

          {/* Mobile Navigation */}
          {isUserLoggedIn ? (
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={isUserLoggedIn.imageUrl} alt="Profile" />
                      <AvatarFallback>
                        {isUserLoggedIn.firstName?.charAt(0) ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-56 bg-white/80 backdrop-blur-sm"
                >
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/dashboard" 
                      className="flex items-center cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4 text-orange-500" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <SignOutButton>
                    <DropdownMenuItem className="text-red-600 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </SignOutButton>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col space-y-4 mt-8">
                    <NavItems />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </MaxWidthWrapper>
    </nav>
  );
}

export default Navbar;
