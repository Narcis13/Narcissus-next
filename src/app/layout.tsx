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
  title: "NextProject - Workflow Automation",
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
          <nav className="bg-gray-800 text-white p-4">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
              <div className="flex gap-6">
                <Link href="/" className="hover:text-blue-300 transition-colors">
                  Home
                </Link>
                {session && (
                  <>
                    <Link href="/dashboard" className="hover:text-blue-300 transition-colors">
                      Dashboard
                    </Link>
                    <Link href="/posts" className="hover:text-blue-300 transition-colors">
                      Posts
                    </Link>
                    <Link href="/credentials" className="hover:text-blue-300 transition-colors">
                      Credentials
                    </Link>
                    <Link href="/profile" className="hover:text-blue-300 transition-colors">
                      Profile
                    </Link>
                  </>
                )}
              </div>
              <div className="flex gap-4 items-center">
                {session ? (
                  <>
                    <span className="text-sm">{session.user?.email}</span>
                    <form
                      action={async () => {
                        "use server";
                        await signOut();
                      }}
                    >
                      <button
                        type="submit"
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm transition-colors"
                      >
                        Sign Out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm transition-colors"
                    >
                      Sign Up
                    </Link>
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
