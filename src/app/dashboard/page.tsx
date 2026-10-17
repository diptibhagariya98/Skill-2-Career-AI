"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Dashboard from "../../components/Dashboard";
import { APP_ROUTES } from "@/constants/endpoints";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace(APP_ROUTES.AUTH);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-500 font-semibold">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
