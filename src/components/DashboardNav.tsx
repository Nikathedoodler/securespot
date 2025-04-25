"use client";

import Link from "next/link";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";

// Use the same session type as admin page
declare module "next-auth" {
  interface Session {
    user: {
      role: UserRole;
    } & {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log("Session:", session);
    console.log("User role:", session?.user?.role);
    console.log("Is admin?", session?.user?.role === "ADMIN");
  }, [session]);

  const handleAdminClick = () => {
    console.log("Clicking admin, role is:", session?.user?.role);
    if (session?.user?.role === "ADMIN") {
      router.push("/admin");
    }
  };

  return (
    <nav className="bg-slate-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex space-x-4">
          <Link
            href="/dashboard"
            className={pathname === "/dashboard" ? "font-bold" : ""}
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/bookings"
            className={pathname === "/dashboard/bookings" ? "font-bold" : ""}
          >
            My Bookings
          </Link>
          <Link
            href="/dashboard/profile"
            className={pathname === "/dashboard/profile" ? "font-bold" : ""}
          >
            Profile
          </Link>
        </div>
        {session?.user?.role === "ADMIN" && (
          <button
            onClick={handleAdminClick}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md"
          >
            Admin Panel
          </button>
        )}
      </div>
    </nav>
  );
}
