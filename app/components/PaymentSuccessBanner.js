"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function BannerInner() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "1";
  const destination = searchParams.get("destination");

  if (!success) return null;

  return (
    <div className="payment-success-banner" role="status">
      ✅ Payment verified
      {destination ? ` for ${decodeURIComponent(destination)}` : ""}. Your booking is confirmed!
    </div>
  );
}

export default function PaymentSuccessBanner() {
  return (
    <Suspense fallback={null}>
      <BannerInner />
    </Suspense>
  );
}
