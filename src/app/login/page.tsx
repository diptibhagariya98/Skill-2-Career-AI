"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { APP_ROUTES } from "@/constants/endpoints";

export default function LoginPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(APP_ROUTES.HOME);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-2 text-gray-500 font-semibold">Redirecting to login portal...</p>
      </div>
    </div>
  );
}
