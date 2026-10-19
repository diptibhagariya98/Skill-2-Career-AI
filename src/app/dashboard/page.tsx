"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Dashboard from "@/components/Dashboard";
import { APP_ROUTES } from "@/constants/endpoints";
import { SkeletonDashboard } from "@/shared/ui/Skeleton";
import { STORAGE_KEYS } from "@/constants/roles";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = (sessionUser: unknown) => {
      const isGuest =
        typeof window !== "undefined" &&
        (localStorage.getItem(STORAGE_KEYS.GUEST_MODE) === "true" ||
          sessionStorage.getItem(STORAGE_KEYS.GUEST_MODE) === "true" ||
          window.location.search.includes("guest=true"));

      if (!sessionUser && !isGuest) {
        router.replace(APP_ROUTES.AUTH);
      } else {
        setLoading(false);
      }
    };

    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAccess(session?.user);
    });

    // 2. Auth state subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAccess(session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return <SkeletonDashboard />;
  }

  return <Dashboard />;
}
