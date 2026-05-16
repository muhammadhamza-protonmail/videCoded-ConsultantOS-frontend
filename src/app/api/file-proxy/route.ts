import { NextRequest, NextResponse } from "next/server";

function resolveBackendUrl(filePath: string): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL || "/api/v1").replace(/\/+$/, "");
  const backendBase = raw.startsWith("http") ? raw : "http://127.0.0.1:8000/api/v1";
  const normalized = filePath.startsWith("/api/v1/")
    ? filePath.replace(/^\/api\/v1/, "")
    : filePath;
  return `${backendBase}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("cos_token")?.value;
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get("path");
  if (!path || !path.startsWith("/api/v1/consultant/assignments/")) {
    return NextResponse.json({ detail: "Invalid file path" }, { status: 400 });
  }

  const upstream = await fetch(resolveBackendUrl(path), {
    headers: {
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "1",
    },
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return new NextResponse(text || "File proxy request failed", { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") || "application/octet-stream";
  const upstreamDisposition = upstream.headers.get("content-disposition") || "";
  const filenameMatch = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(upstreamDisposition);
  const filename = filenameMatch?.[1]?.replace(/\"/g, "") || "document";
  const inlinePreviewable =
    contentType.includes("pdf") ||
    contentType.startsWith("image/") ||
    contentType.startsWith("text/");
  const contentDisposition = inlinePreviewable
    ? `inline; filename="${filename}"`
    : `attachment; filename="${filename}"`;
  const buffer = await upstream.arrayBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition,
      "Cache-Control": "private, max-age=60",
    },
  });
}
