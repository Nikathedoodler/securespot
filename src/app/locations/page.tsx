"use client";

import { useState, useEffect } from "react";
import LocationMap from "@/components/LocationMap";
import { useRouter } from "next/navigation";

interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  totalLockers: number;
  availableLockers: number;
}

export default function LocationsPage() {
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/locations");
      if (!response.ok) throw new Error("Failed to fetch locations");
      const data = await response.json();

      // Transform the data to match the Location interface
      const transformedLocations = data.map((location: any) => ({
        id: location.id,
        name: location.name,
        address: location.address,
        latitude: location.lat,
        longitude: location.lng,
        totalLockers: location.lockers.length,
        availableLockers: location.lockers.filter(
          (locker: any) => locker.status === "AVAILABLE"
        ).length,
      }));

      setLocations(transformedLocations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Locker Locations</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <LocationMap
            locations={locations}
            onLocationClick={handleLocationClick}
          />
        </div>

        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Location Details</h2>
          {selectedLocation ? (
            <div>
              <h3 className="text-lg font-medium mb-2">
                {selectedLocation.name}
              </h3>
              <p className="text-slate-300 mb-4">{selectedLocation.address}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400">Total Lockers</p>
                  <p className="text-lg">{selectedLocation.totalLockers}</p>
                </div>
                <div>
                  <p className="text-slate-400">Available Lockers</p>
                  <p
                    className={`text-lg ${
                      selectedLocation.availableLockers > 0
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {selectedLocation.availableLockers}
                  </p>
                </div>
              </div>
              {selectedLocation.availableLockers > 0 && (
                <button
                  onClick={() =>
                    router.push(`/dashboard?locationId=${selectedLocation.id}`)
                  }
                  className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Book Available Lockers
                </button>
              )}
            </div>
          ) : (
            <p className="text-slate-400">
              Click on a location marker to view details
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
