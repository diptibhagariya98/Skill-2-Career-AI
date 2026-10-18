import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = getServiceSupabase();
    const { data, error } = await admin.from("profiles").select("count").limit(1);

    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        {
          status: "warning",
          message: "Connected to Supabase endpoint, but profiles table query returned a notice.",
          details: error.message,
          hint: "Ensure the SQL migration script (supabase/migrations/20261018_init_profiles.sql) has been executed in the Supabase SQL Editor.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      connected: true,
      timestamp: new Date().toISOString(),
      provider: "supabase",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        connected: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}
