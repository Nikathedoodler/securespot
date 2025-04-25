"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserRole } from "@prisma/client";
import { api } from "../../trpc/react";
import { toast } from "sonner";

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

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role !== "ADMIN") {
        router.replace("/dashboard");
        toast.error("You don't have permission to access this page");
      }
    }
  }, [status, session, router]);

  const { data: stats, isLoading: isLoadingStats } =
    api.admin.getStats.useQuery(undefined, {
      enabled: session?.user?.role === "ADMIN",
    });

  const { data: users, isLoading: isLoadingUsers } =
    api.admin.getUsers.useQuery(undefined, {
      enabled: session?.user?.role === "ADMIN",
    });

  const { data: locations, isLoading: isLoadingLocations } =
    api.admin.getLocations.useQuery(undefined, {
      enabled: session?.user?.role === "ADMIN",
    });

  const utils = api.useUtils();

  const updateUserRoleMutation = api.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated successfully!");
      utils.admin.getUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update user role");
    },
  });

  const deleteLocationMutation = api.admin.deleteLocation.useMutation({
    onSuccess: () => {
      toast.success("Location deleted successfully!");
      utils.admin.getLocations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete location");
    },
  });

  if (
    status === "loading" ||
    isLoadingStats ||
    isLoadingUsers ||
    isLoadingLocations
  ) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  if (!session || session.user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Statistics Card */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">
              Statistics
            </h2>
            <div className="space-y-2">
              <p className="text-gray-300">
                Total Users: {stats?.totalUsers || 0}
              </p>
              <p className="text-gray-300">
                Total Locations: {stats?.totalLocations || 0}
              </p>
              <p className="text-gray-300">
                Active Bookings: {stats?.activeBookings || 0}
              </p>
            </div>
          </div>

          {/* User Management Card */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">
              User Management
            </h2>
            <div className="space-y-4">
              {users?.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-white">{user.name}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                  <select
                    value={user.role}
                    onChange={(e) =>
                      updateUserRoleMutation.mutate({
                        userId: user.id,
                        role: e.target.value as UserRole,
                      })
                    }
                    className="bg-gray-700 text-white rounded px-2 py-1"
                  >
                    {Object.values(UserRole).map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Location Management Card */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">
              Location Management
            </h2>
            <div className="space-y-4">
              {locations?.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-white">{location.name}</p>
                    <p className="text-sm text-gray-400">{location.address}</p>
                  </div>
                  <button
                    onClick={() =>
                      deleteLocationMutation.mutate({ locationId: location.id })
                    }
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              ))}
              <button
                onClick={() => router.push("/admin/locations/new")}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add New Location
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
