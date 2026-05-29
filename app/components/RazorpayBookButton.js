"use client";

import { useState } from "react";
import Script from "next/script";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function RazorpayBookButton({
  destinationId,
  destinationName,
  amountInRupees,
  className = "btn btn-accent package-book-btn",
  children = "Book Now — Pay Online",
  disabled = false,
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handlePayment = async () => {
    setMessage("");
    setMessageType("");

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!keyId) {
      setMessage("Razorpay is not configured. Add NEXT_PUBLIC_RAZORPAY_KEY_ID to .env.local");
      setMessageType("error");
      return;
    }

    if (typeof window === "undefined" || !window.Razorpay) {
      setMessage("Payment gateway is loading. Please try again in a moment.");
      setMessageType("error");
      return;
    }

    const rupees = Math.round(Number(amountInRupees));
    if (!Number.isFinite(rupees) || rupees < 1) {
      setMessage("Invalid package price.");
      setMessageType("error");
      return;
    }

    const amountPaise = rupees * 100;
    setLoading(true);

    try {
      const orderRes = await fetch(`${API}/api/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: `book_${destinationId}_${Date.now()}`,
          notes: {
            destinationId: String(destinationId),
            destinationName: String(destinationName),
          },
        }),
      });

      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson.success) {
        throw new Error(orderJson.message || "Could not create payment order");
      }

      const { order_id, amount, currency } = orderJson.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: "Travel Threads",
        description: `${destinationName} — Travel Package`,
        order_id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API}/api/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyJson = await verifyRes.json();
            if (!verifyRes.ok || !verifyJson.success) {
              throw new Error(verifyJson.message || "Payment verification failed");
            }

            setMessage(`Payment successful for ${destinationName}! Booking confirmed.`);
            setMessageType("success");
            window.location.href = `/book?success=1&destination=${encodeURIComponent(destinationId)}`;
          } catch (err) {
            setMessage(err.message || "Verification failed");
            setMessageType("error");
          } finally {
            setLoading(false);
          }
        },
        theme: { color: "#6366f1" },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setMessage("Payment cancelled.");
            setMessageType("error");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setLoading(false);
        setMessage(
          response.error?.description || response.error?.reason || "Payment failed. Please try again."
        );
        setMessageType("error");
      });
      rzp.open();
    } catch (err) {
      setMessage(err.message || "Unable to start checkout");
      setMessageType("error");
      setLoading(false);
    }
  };

  return (
    <div className="razorpay-book-wrap">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <button
        type="button"
        className={className}
        onClick={handlePayment}
        disabled={disabled || loading}
        id={`pay-btn-${destinationId}`}
      >
        {loading ? "Opening checkout…" : children}
      </button>
      {message ? (
        <p className={`payment-status payment-status-${messageType || "info"}`}>{message}</p>
      ) : null}
    </div>
  );
}
