"use client";

import { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";

declare global {
  interface Window {
    google: typeof google;
  }
}

interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  totalLockers: number;
  availableLockers: number;
}

interface LocationMapProps {
  locations: Location[];
  onLocationClick?: (location: Location) => void;
}

export default function LocationMap({
  locations,
  onLocationClick,
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        version: "weekly",
      });

      try {
        const google = await loader.load();
        const map = new google.maps.Map(mapRef.current!, {
          center: { lat: 1.3521, lng: 103.8198 }, // Default to Singapore
          zoom: 12,
        });

        mapInstance.current = map;

        // Clear existing markers
        markers.current.forEach((marker) => marker.setMap(null));
        markers.current = [];

        // Add markers for each location
        locations.forEach((location) => {
          const marker = new google.maps.Marker({
            position: { lat: location.latitude, lng: location.longitude },
            map,
            title: location.name,
            label: {
              text: location.availableLockers.toString(),
              color: "white",
              fontWeight: "bold",
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: location.availableLockers > 0 ? "#10B981" : "#EF4444",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "white",
            },
          });

          marker.addListener("click", () => {
            if (onLocationClick) {
              onLocationClick(location);
            }
          });

          markers.current.push(marker);
        });

        // Fit map to show all markers
        if (locations.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          locations.forEach((location) => {
            bounds.extend({ lat: location.latitude, lng: location.longitude });
          });
          map.fitBounds(bounds);
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    initMap();
  }, [locations, onLocationClick]);

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
