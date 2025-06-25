import '@/lib/engine-loader';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import AuthSessionProvider from "@/components/auth/session-provider";
import { auth } from "@/auth";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlowForge AI - Workflow Automation",
  description: "AI-powered workflow automation platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          <nav className="border-b">
            <div className="flex h-16 items-center px-4 container mx-auto">
              <div className="flex items-center space-x-4 lg:space-x-6">
                <Link href="/" className="text-xl font-semibold">
                  FlowForge AI
                </Link>
                
                {/* Mobile menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="lg:hidden">
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    <DropdownMenuItem asChild>
                      <Link href="/">Home</Link>
                    </DropdownMenuItem>
                    {session && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard">Dashboard</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/workflows">Workflows</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/posts">Posts</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/credentials">Credentials</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/profile">Profile</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Desktop navigation */}
              <NavigationMenu className="hidden lg:flex mx-6">
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link href="/" className={navigationMenuTriggerStyle()}>
                        Home
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  {session && (
                    <>
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link href="/dashboard" className={navigationMenuTriggerStyle()}>
                            Dashboard
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link href="/workflows" className={navigationMenuTriggerStyle()}>
                            Workflows
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link href="/posts" className={navigationMenuTriggerStyle()}>
                            Posts
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link href="/credentials" className={navigationMenuTriggerStyle()}>
                            Credentials
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link href="/profile" className={navigationMenuTriggerStyle()}>
                            Profile
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    </>
                  )}
                </NavigationMenuList>
              </NavigationMenu>

              <div className="ml-auto flex items-center space-x-4">
                {session ? (
                  <>
                    <span className="text-sm text-muted-foreground">{session.user?.email}</span>
                    <form
                      action={async () => {
                        "use server";
                        await signOut();
                      }}
                    >
                      <Button type="submit" variant="destructive" size="sm">
                        Sign Out
                      </Button>
                    </form>
                  </>
                ) : (
                  <>
                    <Button asChild size="sm">
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/signup">Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </nav>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
