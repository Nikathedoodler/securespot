"use client";

import React from "react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import type { AppRouter } from "@/server/api/root";
import { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Booking = RouterOutput["booking"]["getUserBookings"][number];

export default function BookingList() {
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [extensionHours, setExtensionHours] = useState(1);
  const [processing, setProcessing] = useState(false);

  const utils = api.useUtils();

  const {
    data: bookings = [],
    isLoading: loading,
    error,
  } = api.booking.getUserBookings.useQuery();

  const cancelBookingMutation = api.booking.cancelBooking.useMutation({
    onSuccess: async (data) => {
      console.log("Cancel Success:", data);
      await utils.booking.getUserBookings.invalidate();
      await utils.locker.getLockers.invalidate();
      setShowCancelModal(false);
      setSelectedBooking(null);
      toast.success(
        data.refundAmount
          ? `Booking cancelled. Refund of $${data.refundAmount.toFixed(
              2
            )} will be processed.`
          : "Booking cancelled successfully"
      );
    },
    onError: (error) => {
      console.error("Cancel Error:", error);
      setShowCancelModal(false);
      setSelectedBooking(null);
      toast.error(error.message || "Failed to cancel booking");
    },
  });

  const handleExtend = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowExtensionModal(true);
  };

  const handleCancel = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const confirmExtension = async () => {
    if (!selectedBooking) return;

    try {
      setProcessing(true);
      const response = await fetch("/api/bookings/extend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          additionalHours: extensionHours,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to extend booking");
      }

      await utils.booking.getUserBookings.invalidate();
      await utils.locker.getLockers.invalidate();
      setShowExtensionModal(false);
      setSelectedBooking(null);
      setExtensionHours(1);
      toast.success("Booking extended successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to extend booking"
      );
    } finally {
      setProcessing(false);
    }
  };

  const confirmCancellation = async () => {
    if (!selectedBooking) return;

    try {
      setProcessing(true);
      await cancelBookingMutation.mutateAsync({
        bookingId: selectedBooking.id,
      });
    } catch (err) {
      // Error is handled in the mutation's onError
    } finally {
      setProcessing(false);
    }
  };

  const getTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();

    if (diff <= 0) {
      return "Expired";
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/10 p-4 text-center text-red-500">
        Error: {error.message}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-lg bg-gray-800/50 p-8 text-center text-gray-400 backdrop-blur-sm">
        No active bookings
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {bookings
        .filter(
          (booking) =>
            booking.status !== "CANCELED" &&
            new Date(booking.endTime) > new Date()
        )
        .map((booking) => (
          <div
            key={booking.id}
            className="rounded-lg bg-gray-800/50 p-6 text-white shadow-lg backdrop-blur-sm"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Locker #{booking.locker.id}
                </h3>
                <p className="mt-1 text-gray-400">
                  {booking.locker.location.name}
                </p>
                <p className="mt-2">Size: {booking.locker.size}</p>
                <div className="mt-2 text-sm text-gray-400">
                  <p>
                    Start:{" "}
                    {booking.startTime.toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <p>
                    End:{" "}
                    {booking.endTime.toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <p className="mt-2 font-mono">
                  Amount paid: ${booking.payment?.amount?.toFixed(2) ?? "0.00"}
                </p>
              </div>

              <div className="flex flex-col items-end space-y-2">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    booking.endTime > new Date()
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {booking.endTime > new Date() ? "ACTIVE" : "EXPIRED"}
                </span>
                <p className="text-sm text-gray-400">
                  {getTimeRemaining(booking.endTime)}
                </p>
                {booking.endTime > new Date() && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleExtend(booking)}
                      disabled={processing}
                      className="rounded px-3 py-1 text-sm font-medium text-green-400 hover:bg-green-500/10 hover:text-green-300 disabled:opacity-50"
                    >
                      Extend
                    </button>
                    <button
                      onClick={() => handleCancel(booking)}
                      disabled={processing}
                      className="rounded px-3 py-1 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

      {/* Extension Modal */}
      {showExtensionModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-gray-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Extend Booking
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200">
                  Additional Hours
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={extensionHours}
                  onChange={(e) => setExtensionHours(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 p-2 text-white"
                />
                <p className="mt-1 text-sm text-gray-400">
                  Additional cost: ${(extensionHours * 5).toFixed(2)}
                </p>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowExtensionModal(false);
                    setSelectedBooking(null);
                    setExtensionHours(1);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmExtension}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  disabled={processing}
                >
                  {processing ? "Processing..." : "Extend Booking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-gray-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Cancel Booking
            </h3>
            <p className="text-gray-300">
              Are you sure you want to cancel this booking? Refund amount will
              be calculated based on the cancellation time:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-400">
              <li>Full refund if cancelled more than 24 hours before start</li>
              <li>50% refund if cancelled 12-24 hours before start</li>
              <li>No refund if cancelled less than 12 hours before start</li>
            </ul>
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedBooking(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
                disabled={processing}
              >
                Keep Booking
              </button>
              <button
                onClick={confirmCancellation}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                disabled={processing}
              >
                {processing ? "Processing..." : "Cancel Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
