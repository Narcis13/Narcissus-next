import '@/lib/engine-loader';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import AuthSessionProvider from "@/components/auth/session-provider";
import { auth } from "@/auth";
import { signOut } from "@/auth";

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
          <nav className="navbar bg-base-200">
            <div className="navbar-start">
              <div className="dropdown">
                <label tabIndex={0} className="btn btn-ghost lg:hidden">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
                  </svg>
                </label>
                <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                  <li><Link href="/">Home</Link></li>
                  {session && (
                    <>
                      <li><Link href="/dashboard">Dashboard</Link></li>
                      <li><Link href="/workflows">Workflows</Link></li>
                      <li><Link href="/posts">Posts</Link></li>
                      <li><Link href="/credentials">Credentials</Link></li>
                      <li><Link href="/profile">Profile</Link></li>
                    </>
                  )}
                </ul>
              </div>
              <Link href="/" className="btn btn-ghost text-xl">FlowForge AI</Link>
            </div>
            <div className="navbar-center hidden lg:flex">
              <ul className="menu menu-horizontal px-1">
                <li><Link href="/">Home</Link></li>
                {session && (
                  <>
                    <li><Link href="/dashboard">Dashboard</Link></li>
                    <li><Link href="/workflows">Workflows</Link></li>
                    <li><Link href="/posts">Posts</Link></li>
                    <li><Link href="/credentials">Credentials</Link></li>
                    <li><Link href="/profile">Profile</Link></li>
                  </>
                )}
              </ul>
            </div>
            <div className="navbar-end">
              {session ? (
                <>
                  <span className="text-sm mr-4">{session.user?.email}</span>
                  <form
                    action={async () => {
                      "use server";
                      await signOut();
                    }}
                  >
                    <button type="submit" className="btn btn-error btn-sm">
                      Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-primary btn-sm mr-2">
                    Login
                  </Link>
                  <Link href="/signup" className="btn btn-success btn-sm">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </nav>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
