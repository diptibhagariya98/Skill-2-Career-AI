import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { ResumeZodSchema } from "@/lib/resume/schema-zod";
import { ResumeDocument } from "@/components/resume/ResumeDocument";
import { generateResumePdf } from "@/lib/server/pdfRenderer";
import { ExportErrorCode, ResumeData } from "@/types/resume";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    if (!body || typeof body !== "object" || !("resume" in body)) {
      return NextResponse.json(
        {
          error: {
            code: ExportErrorCode.INVALID_PAYLOAD,
            message: "Missing 'resume' payload in request body.",
          },
        },
        { status: 400 }
      );
    }

    const rawResume = (body as { resume: unknown }).resume;
    const parsed = ResumeZodSchema.safeParse(rawResume);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: ExportErrorCode.INVALID_PAYLOAD,
            message: "Resume data failed schema validation.",
            details: parsed.error.issues,
          },
        },
        { status: 422 }
      );
    }

    const resume = parsed.data;

    // Sanitize file name for Content-Disposition
    const cleanName = (resume.contact.fullName || "")
      .trim()
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
    const filename = cleanName ? `${cleanName}_Resume.pdf` : "Resume.pdf";

    // 1. Render universal ResumeDocument into static HTML string
    const { renderToStaticMarkup } = await import("react-dom/server");
    const htmlMarkup = renderToStaticMarkup(
      React.createElement(ResumeDocument, {
        resume: resume as unknown as ResumeData,
        isPrintMode: true,
      })
    );

    // 2. Generate vector PDF via server-side Chromium engine
    const pdfBuffer = await generateResumePdf(htmlMarkup, {
      pageSize: resume.meta.pageSize === "Letter" ? "Letter" : "A4",
    });

    // 3. Return binary PDF with proper headers for instant browser / native download
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.byteLength.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to generate PDF";
    console.error("[/api/resumes/export] Error:", error);

    return NextResponse.json(
      {
        error: {
          code: ExportErrorCode.RENDER_FAILED,
          message: msg,
        },
      },
      { status: 500 }
    );
  }
}
