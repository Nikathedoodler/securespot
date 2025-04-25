"use client";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { redirect } from "next/navigation";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <div className="flex space-x-4">
            <Link
              href="/admin"
              className={`px-4 py-2 rounded-md ${
                pathname === "/admin"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Overview
            </Link>
            <Link
              href="/admin/users"
              className={`px-4 py-2 rounded-md ${
                pathname === "/admin/users"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Users
            </Link>
            <Link
              href="/admin/lockers"
              className={`px-4 py-2 rounded-md ${
                pathname === "/admin/lockers"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Lockers
            </Link>
            <Link
              href="/admin/bookings"
              className={`px-4 py-2 rounded-md ${
                pathname === "/admin/bookings"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Bookings
            </Link>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
