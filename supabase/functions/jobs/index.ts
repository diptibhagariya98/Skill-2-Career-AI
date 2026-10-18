import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const RAPID_JOBS_HOST = "jsearch.p.rapidapi.com";
const RAPID_JOBS_BASE = "https://jsearch.p.rapidapi.com/search";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("RAPIDAPI_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "RAPIDAPI_KEY is not configured in Supabase Edge Function secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const query = url.searchParams.get("query") || "Developer in India";
    const location = url.searchParams.get("location") || "";
    const combinedQuery = location ? `${query} in ${location}` : query;

    const rapidUrl = `${RAPID_JOBS_BASE}?query=${encodeURIComponent(combinedQuery)}&num_pages=1`;

    const response = await fetch(rapidUrl, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": RAPID_JOBS_HOST,
      },
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
