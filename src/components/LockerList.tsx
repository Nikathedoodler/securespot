// src/components/LockerList.tsx
"use client";

import { useState, useEffect } from "react";

type Locker = {
  id: string;
  size: "SMALL" | "MEDIUM" | "LARGE" | "XLARGE";
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "RESERVED";
  location: {
    name: string;
    address: string;
  };
};

export default function LockerList() {
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDuration, setBookingDuration] = useState(1);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  useEffect(() => {
    console.log("LockerList mounted");
    fetchLockers();
  }, []);

  const fetchLockers = async () => {
    try {
      console.log("Fetching lockers...");
      const response = await fetch("/api/lockers");
      if (!response.ok) {
        throw new Error("Failed to fetch lockers");
      }
      const data = await response.json();
      console.log("Fetched lockers:", data);
      setLockers(data);
    } catch (err) {
      console.error("Error fetching lockers:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBookLocker = (locker: Locker) => {
    console.log("Opening booking modal for locker:", locker);
    setSelectedLocker(locker);
    setShowBookingModal(true);
    setBookingError(null);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Duration changed:", e.target.value);
    setBookingDuration(Number(e.target.value));
  };

  const handleCancel = () => {
    console.log("Cancelling booking");
    setShowBookingModal(false);
    setSelectedLocker(null);
    setBookingError(null);
  };

  const handleConfirm = async () => {
    console.log("Confirming booking...");
    if (!selectedLocker) {
      console.log("No locker selected");
      return;
    }

    // Calculate the total amount
    const totalAmount = bookingDuration * 5; // $5 per hour
    console.log("Total amount:", totalAmount);

    // Show payment modal instead of directly creating booking
    setShowBookingModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    setIsBooking(true);
    setBookingError(null);

    try {
      // Validate payment details
      if (
        !paymentDetails.cardNumber ||
        !paymentDetails.expiryDate ||
        !paymentDetails.cvv
      ) {
        throw new Error("Please fill in all payment details");
      }

      console.log("Processing payment and creating booking...", {
        lockerId: selectedLocker?.id,
        duration: bookingDuration,
      });

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lockerId: selectedLocker?.id,
          duration: bookingDuration,
          paymentDetails, // In a real app, this would be sent to a payment processor
        }),
      });

      console.log("Booking response status:", response.status);
      const data = await response.json();
      console.log("Booking response data:", data);

      if (!response.ok) {
        console.error("Booking failed:", data);
        throw new Error(data.error || "Failed to create booking");
      }

      // Refresh the lockers list
      await fetchLockers();
      setShowPaymentModal(false);
      setSelectedLocker(null);
      setBookingDuration(1);
      setPaymentDetails({ cardNumber: "", expiryDate: "", cvv: "" });
    } catch (err) {
      console.error("Booking error:", err);
      setBookingError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsBooking(false);
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
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Available Lockers
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lockers.map((locker, index) => (
            <div
              key={locker.id}
              className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-white font-medium">Locker {index + 1}</h4>
                  <p className="text-slate-400 text-sm">
                    {locker.location.name}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    locker.status === "AVAILABLE"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {locker.status}
                </span>
              </div>
              <button
                onClick={() => handleBookLocker(locker)}
                disabled={locker.status !== "AVAILABLE"}
                className={`mt-4 w-full py-2 rounded-md ${
                  locker.status === "AVAILABLE"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-slate-700 text-slate-400 cursor-not-allowed"
                }`}
              >
                {locker.status === "AVAILABLE" ? "Book Now" : "Unavailable"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {showBookingModal && selectedLocker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">
              Book Locker {selectedLocker.id}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={bookingDuration}
                  onChange={handleDurationChange}
                  className="mt-1 block w-full rounded-md bg-slate-700 border-slate-600 text-white p-2"
                />
                <p className="text-slate-400 text-sm mt-1">
                  Total cost: ${(bookingDuration * 5).toFixed(2)}
                </p>
              </div>
              {bookingError && (
                <div className="text-red-500 text-sm">{bookingError}</div>
              )}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-slate-300 hover:text-white"
                  disabled={isBooking}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isBooking}
                >
                  {isBooking ? "Processing..." : "Proceed to Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">
              Payment Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200">
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
                  className="mt-1 block w-full rounded-md bg-slate-700 border-slate-600 text-white p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200">
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
                    className="mt-1 block w-full rounded-md bg-slate-700 border-slate-600 text-white p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200">
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
                    className="mt-1 block w-full rounded-md bg-slate-700 border-slate-600 text-white p-2"
                  />
                </div>
              </div>
              <div className="bg-slate-700 p-4 rounded-md">
                <p className="text-slate-200">
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
                    setPaymentDetails({
                      cardNumber: "",
                      expiryDate: "",
                      cvv: "",
                    });
                  }}
                  className="px-4 py-2 text-slate-300 hover:text-white"
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
