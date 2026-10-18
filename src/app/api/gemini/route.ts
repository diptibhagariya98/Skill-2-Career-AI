import { NextRequest, NextResponse } from "next/server";
import { EXTERNAL_API } from "@/constants/endpoints";
import { getErrorMessage } from "@/constants/auth";

export const dynamic = "force-dynamic";

interface GeminiRequestBody {
  contents?: unknown;
  generationConfig?: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const body: GeminiRequestBody = await request.json();
    const { contents, generationConfig } = body;

    if (!contents) {
      return NextResponse.json({ error: "Missing contents payload." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server." },
        { status: 500 }
      );
    }

    const geminiUrl = EXTERNAL_API.getGeminiUrl(apiKey);

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: generationConfig || { temperature: 0.3 },
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      return NextResponse.json(
        { error: errorData?.error?.message || response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Internal Server Error") },
      { status: 500 }
    );
  }
}
