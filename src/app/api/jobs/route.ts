import { NextRequest, NextResponse } from "next/server";
import { EXTERNAL_API } from "@/constants/endpoints";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "Developer in India";
    const location = searchParams.get("location") || "";

    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "RapidAPI key is not configured on the server." }, { status: 500 });
    }

    const combinedQuery = location ? `${query} in ${location}` : query;
    const url = EXTERNAL_API.getJobsUrl(combinedQuery);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": EXTERNAL_API.RAPID_JOBS_HOST
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
