import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 5000;
const CRITERION = "specific-dish-mentioned";

export async function POST(request: NextRequest) {
  const apiKey = process.env.WHETDATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Whetdata API key is not configured" },
      { status: 500 }
    );
  }

  let body: { text?: unknown };
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = body?.text;
  if (!text || typeof text !== "string") {
    return NextResponse.json(
      { error: "Text is required and must be a string" },
      { status: 400 }
    );
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: "Text exceeds maximum length of 5000 characters" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch("https://www.whetdata.com/api/classify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        criteria: [CRITERION],
      }),
    });

    const rawBody = await response.text();
    let data: Record<string, unknown> | null = null;
    try {
      data = rawBody ? JSON.parse(rawBody) : null;
    } catch (error) {
      data = null;
    }

    if (!response.ok) {
      console.error("Whetdata classify failed", {
        status: response.status,
        statusText: response.statusText,
        rawBody: rawBody?.slice(0, 500),
      });
      return NextResponse.json(
        {
          error: "Whetdata classify failed",
          details:
            (data as { error?: string; message?: string } | null)?.error ||
            (data as { error?: string; message?: string } | null)?.message ||
            response.statusText,
        },
        { status: response.status }
      );
    }

    const score = (data as { scores?: Record<string, number> } | null)?.scores?.[
      CRITERION
    ];
    if (typeof score !== "number") {
      console.error("Whetdata classify invalid response", {
        rawBody: rawBody?.slice(0, 500),
      });
      return NextResponse.json(
        { error: "Invalid classify response", raw: rawBody?.slice(0, 300) },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, score });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Whetdata classify internal error", { message });
    return NextResponse.json(
      { error: "Internal server error", message },
      { status: 500 }
    );
  }
}
