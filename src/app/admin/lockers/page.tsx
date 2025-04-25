"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type Locker = {
  id: string;
  size: string;
  status: string;
  location: {
    name: string;
    address: string;
  };
  createdAt: Date;
};

export default function LockersPage() {
  const { data: session } = useSession();
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingLockerId, setEditingLockerId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  useEffect(() => {
    fetchLockers();
  }, []);

  const fetchLockers = async () => {
    try {
      const response = await fetch("/api/admin/lockers");
      if (!response.ok) throw new Error("Failed to fetch lockers");
      const data = await response.json();
      setLockers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lockers");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (lockerId: string) => {
    try {
      const response = await fetch("/api/admin/lockers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lockerId, status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update locker status");

      const updatedLocker = await response.json();
      setLockers(
        lockers.map((locker) =>
          locker.id === lockerId ? updatedLocker : locker
        )
      );
      setEditingLockerId(null);
      setNewStatus("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update locker status"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Locker Management</h2>
      </div>

      <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {lockers.map((locker) => (
              <tr key={locker.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">
                    {locker.location.name}
                  </div>
                  <div className="text-sm text-gray-300">
                    {locker.location.address}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {locker.size}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingLockerId === locker.id ? (
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="bg-gray-700 text-white rounded-md px-2 py-1"
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="OCCUPIED">Occupied</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="RESERVED">Reserved</option>
                    </select>
                  ) : (
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        locker.status === "AVAILABLE"
                          ? "bg-green-100 text-green-800"
                          : locker.status === "OCCUPIED"
                          ? "bg-yellow-100 text-yellow-800"
                          : locker.status === "MAINTENANCE"
                          ? "bg-red-100 text-red-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {locker.status}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {editingLockerId === locker.id ? (
                    <div className="space-x-2">
                      <button
                        onClick={() => handleUpdateStatus(locker.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingLockerId(null);
                          setNewStatus("");
                        }}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingLockerId(locker.id);
                        setNewStatus(locker.status);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit Status
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
