"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetAdminPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSetAdmin = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/set-role", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to set admin role");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6">Set Admin Role</h1>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-md mb-4">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-500/10 text-green-500 p-4 rounded-md">
            Successfully set admin role! Redirecting...
          </div>
        ) : (
          <button
            onClick={handleSetAdmin}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Setting admin role..." : "Set Admin Role"}
          </button>
        )}
      </div>
    </div>
  );
}
