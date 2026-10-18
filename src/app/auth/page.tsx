"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Auth from "../../components/Auth";
import { APP_ROUTES } from "@/constants/endpoints";
import { PremiumTransitionLoader } from "@/shared/ui/PremiumTransitionLoader";

export const dynamic = "force-dynamic";

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        router.replace(APP_ROUTES.DASHBOARD);
      } else {
        setLoading(false);
      }
    });

    // 2. Auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        router.replace(APP_ROUTES.DASHBOARD);
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <PremiumTransitionLoader
        label="Securing Session"
        subtitle="Verifying your authentication status..."
        fullscreen={true}
      />
    );
  }

  return <Auth />;
}
