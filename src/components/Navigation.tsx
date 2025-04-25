"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => pathname === path;

  console.log("Navigation - Session:", session);
  console.log("Navigation - User role:", session?.user?.role);

  const handleAdminClick = () => {
    console.log("Clicking admin from Navigation");
    router.push("/admin");
  };

  const handleProfileClick = () => {
    router.push("/profile");
  };

  return (
    <nav className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-white text-xl font-bold">
              SecureSpot
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  href="/dashboard"
                  className={`${
                    isActive("/dashboard")
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  } px-3 py-2 rounded-md text-sm font-medium`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/locations"
                  className={`${
                    isActive("/locations")
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  } px-3 py-2 rounded-md text-sm font-medium`}
                >
                  Locations
                </Link>
                {session?.user?.role === "ADMIN" && (
                  <button
                    onClick={handleAdminClick}
                    className={`${
                      isActive("/admin")
                        ? "bg-gray-900 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    } px-3 py-2 rounded-md text-sm font-medium`}
                  >
                    Admin Panel
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-gray-300">
                      {session.user.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {session.user.email}
                    </span>
                  </div>
                  <button
                    onClick={handleProfileClick}
                    className="focus:outline-none"
                  >
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt="Profile"
                        className="h-8 w-8 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center cursor-pointer hover:bg-gray-500">
                        <span className="text-sm text-white">
                          {session.user.name?.[0] || "U"}
                        </span>
                      </div>
                    )}
                  </button>
                  <Link
                    href="/api/auth/signout"
                    className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Out
                  </Link>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
