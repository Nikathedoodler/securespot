// src/app/dashboard/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "../../trpc/react";
import { useState } from "react";
import { toast } from "sonner";
import BookingList from "@/components/BookingList";

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("lockers");
  const utils = api.useUtils();

  // Booking modal state
  const [selectedLocker, setSelectedLocker] = useState<any | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingDuration, setBookingDuration] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  const {
    data: lockers,
    isLoading,
    error,
  } = api.locker.getLockers.useQuery(undefined, {
    retry: 1,
  });

  const handleBookClick = (locker: any) => {
    setSelectedLocker(locker);
    setShowBookingModal(true);
    setBookingError(null);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBookingDuration(Number(e.target.value));
  };

  const handleProceedToPayment = () => {
    setShowBookingModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    try {
      setIsBooking(true);
      setBookingError(null);

      // Validate payment details
      if (
        !paymentDetails.cardNumber ||
        !paymentDetails.expiryDate ||
        !paymentDetails.cvv
      ) {
        throw new Error("Please fill in all payment details");
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lockerId: selectedLocker.id,
          duration: bookingDuration,
          paymentDetails,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create booking");
      }

      toast.success("Locker booked successfully!");
      utils.locker.getLockers.invalidate();
      setShowPaymentModal(false);
      setSelectedLocker(null);
      setBookingDuration(1);
      setPaymentDetails({ cardNumber: "", expiryDate: "", cvv: "" });
      setActiveTab("bookings");
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading || sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    console.error("Error loading lockers:", error);
    toast.error("Failed to load lockers. Please try again.");
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="text-red-400">
          Error loading lockers. Please refresh the page to try again.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="mb-8 text-3xl font-bold text-white">Dashboard</h1>

      <div className="mb-8 flex gap-4">
        <button
          onClick={() => setActiveTab("lockers")}
          className={`rounded-md px-4 py-2 ${
            activeTab === "lockers"
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Lockers
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`rounded-md px-4 py-2 ${
            activeTab === "bookings"
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          My Bookings
        </button>
      </div>

      {activeTab === "lockers" ? (
        <>
          <h2 className="mb-8 text-2xl font-bold text-white">
            Available Lockers
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {lockers?.map((locker) => (
              <div
                key={locker.id}
                className="rounded-lg bg-gray-800/50 p-6 text-white shadow-lg backdrop-blur-sm"
              >
                <h2 className="text-xl font-semibold">Locker</h2>
                <p className="mt-1 break-all font-mono text-sm text-gray-400">
                  #{locker.id}
                </p>
                <p className="mt-4 text-gray-400">{locker.location.name}</p>
                <div className="mt-4 flex items-center justify-between">
                  <p>Size: {locker.size}</p>
                  <span
                    className={`rounded px-2 py-1 text-sm ${
                      locker.status === "AVAILABLE"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {locker.status}
                  </span>
                </div>
                {locker.status === "AVAILABLE" && (
                  <button
                    onClick={() => handleBookClick(locker)}
                    className="mt-4 w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Book Now
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <BookingList />
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedLocker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">
              Book Locker #{selectedLocker.id}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={bookingDuration}
                  onChange={handleDurationChange}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                />
                <p className="text-gray-400 text-sm mt-1">
                  Total cost: ${(bookingDuration * 5).toFixed(2)}
                </p>
              </div>
              {bookingError && (
                <div className="text-red-500 text-sm">{bookingError}</div>
              )}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedLocker(null);
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceedToPayment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedLocker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">
              Payment Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={paymentDetails.cardNumber}
                  onChange={(e) =>
                    setPaymentDetails({
                      ...paymentDetails,
                      cardNumber: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200">
                  Expiry Date
                </label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={paymentDetails.expiryDate}
                  onChange={(e) =>
                    setPaymentDetails({
                      ...paymentDetails,
                      expiryDate: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200">
                  CVV
                </label>
                <input
                  type="text"
                  placeholder="123"
                  value={paymentDetails.cvv}
                  onChange={(e) =>
                    setPaymentDetails({
                      ...paymentDetails,
                      cvv: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                />
              </div>
              <div className="bg-gray-700 p-4 rounded-md">
                <p className="text-gray-200">
                  Total Amount: ${(bookingDuration * 5).toFixed(2)}
                </p>
              </div>
              {bookingError && (
                <div className="text-red-500 text-sm">{bookingError}</div>
              )}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setShowBookingModal(true);
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                  disabled={isBooking}
                >
                  Back
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  disabled={isBooking}
                >
                  {isBooking ? "Processing..." : "Pay Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
