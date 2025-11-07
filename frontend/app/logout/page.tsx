"use client";

import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    }
  }, []);

  return <div className="p-6">Uitloggen.</div>;
}
