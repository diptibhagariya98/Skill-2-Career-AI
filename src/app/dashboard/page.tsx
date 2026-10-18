"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Dashboard from "../../components/Dashboard";
import { APP_ROUTES } from "@/constants/endpoints";
import { SkeletonDashboard } from "@/shared/ui/Skeleton";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.replace(APP_ROUTES.AUTH);
      } else {
        setLoading(false);
      }
    });

    // 2. Auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace(APP_ROUTES.AUTH);
      } else {
        setLoading(false);
      }
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
