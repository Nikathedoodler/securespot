"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Location = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  lockers: {
    id: string;
    size: string;
    status: string;
  }[];
};

export default function LocationPage({ params }: { params: { id: string } }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("ALL");
  const router = useRouter();

  useEffect(() => {
    fetchLocation();
  }, [params.id]);

  const fetchLocation = async () => {
    try {
      const response = await fetch(`/api/locations/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch location");
      const data = await response.json();
      setLocation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load location");
    } finally {
      setLoading(false);
    }
  };

  const filteredLockers = location?.lockers.filter(
    (locker) => selectedSize === "ALL" || locker.size === selectedSize
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-500/20 text-green-400";
      case "OCCUPIED":
        return "bg-blue-500/20 text-blue-400";
      case "MAINTENANCE":
        return "bg-red-500/20 text-red-400";
      case "RESERVED":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-400";
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

  if (!location) {
    return <div className="text-center p-4">Location not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{location.name}</h1>
        <p className="text-slate-400">
          {location.address}
          <br />
          {location.city}, {location.state} {location.zipCode}
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-slate-300">Filter by size:</label>
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="bg-slate-700 text-white rounded-md px-3 py-1"
          >
            <option value="ALL">All Sizes</option>
            <option value="SMALL">Small</option>
            <option value="MEDIUM">Medium</option>
            <option value="LARGE">Large</option>
            <option value="XLARGE">X-Large</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLockers?.map((locker) => (
          <div
            key={locker.id}
            className={`bg-slate-800 rounded-lg p-6 ${
              locker.status === "AVAILABLE"
                ? "hover:bg-slate-700 cursor-pointer"
                : ""
            }`}
            onClick={() => {
              if (locker.status === "AVAILABLE") {
                router.push(`/book?lockerId=${locker.id}`);
              }
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-white">
                Locker {locker.id.slice(-4)}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  locker.status
                )}`}
              >
                {locker.status}
              </span>
            </div>
            <p className="text-slate-400">Size: {locker.size}</p>
            {locker.status === "AVAILABLE" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/book?lockerId=${locker.id}`);
                }}
                className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Book Now
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
