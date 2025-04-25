"use client";
import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BookingPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = params;
  const [duration, setDuration] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.push("/login");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDuration(Number(e.target.value));
  };

  const handleProceedToPayment = () => {
    setShowPayment(true);
  };

  const handlePaymentSubmit = async () => {
    try {
      setIsBooking(true);
      setError(null);

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
          lockerId: id,
          duration,
          paymentDetails,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create booking");
      }

      // Redirect to dashboard on success
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Book Locker</h1>
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          {!showPayment ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={duration}
                    onChange={handleDurationChange}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                  />
                  <p className="text-gray-400 text-sm mt-1">
                    Total cost: ${(duration * 5).toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => router.back()}
                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProceedToPayment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
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
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div className="bg-gray-700 p-4 rounded-md">
                  <p className="text-gray-200">
                    Total Amount: ${(duration * 5).toFixed(2)}
                  </p>
                </div>
                {error && (
                  <div className="text-red-500 text-sm p-2 bg-red-500/10 rounded">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowPayment(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
                    disabled={isBooking}
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePaymentSubmit}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    disabled={isBooking}
                  >
                    {isBooking ? "Processing..." : "Pay Now"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
