"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Auth from "../../components/Auth";
import { APP_ROUTES } from "@/constants/endpoints";

export const dynamic = "force-dynamic";

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const { getDoc, doc } = await import("firebase/firestore");
          const { db } = await import("../../lib/firebase");
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists() && userDoc.data().status === "PENDING_VERIFICATION") {
            setLoading(false);
            return;
          }
        } catch {
          // If network check fails, fallback to normal state
        }
        router.replace(APP_ROUTES.DASHBOARD);
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
          <p className="mt-4 text-gray-500 font-semibold">Verifying session...</p>
        </div>
      </div>
    );
  }

  return <Auth />;
}
