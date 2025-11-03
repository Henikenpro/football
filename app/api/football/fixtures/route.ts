// app/api/football/fixtures/route.ts
import { NextResponse } from "next/server";

const HOST = process.env.API_FOOTBALL_HOST ?? "v3.football.api-sports.io";
const KEY = process.env.FOOTBALL_API_KEY ?? "";
const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";
const FETCH_TIMEOUT = 15000;

function timeoutPromise<T>(ms: number, promise: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timeout"));
    }, ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

async function forwardToApiFootball(path: string, searchParams: URLSearchParams) {
  // Ensure timezone default if not provided
  if (!searchParams.has("timezone")) {
    searchParams.set("timezone", DEFAULT_TIMEZONE);
  }

  const url = `https://${HOST}${path}?${searchParams.toString()}`;
  const headers: Record<string, string> = {
    "x-apisports-host": HOST,
    "x-apisports-key": KEY,
    Accept: "application/json",
  };

  const resp = await timeoutPromise(
    FETCH_TIMEOUT,
    fetch(url, {
      method: "GET",
      headers,
    })
  );

  const status = resp.status;
  const text = await resp.text();

  // try parse JSON, fallback to text
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  // Log for debugging (server console)
  console.log(`[proxy] ${url} -> status=${status}`, {
    sampleBody:
      typeof json === "string"
        ? json.slice(0, 200)
        : json && typeof json === "object"
        ? Object.keys(json).slice(0, 5)
        : json,
  });

  return { status, body: json };
}

export async function GET(req: Request) {
  if (!KEY) {
    return NextResponse.json({ error: "Missing FOOTBALL_API_KEY on server" }, { status: 500 });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    // Forward everything to /fixtures
    const result = await forwardToApiFootball("/fixtures", params);

    // Return with same status code as API-Football
    return NextResponse.json(result.body, { status: result.status });
  } catch (err: any) {
    console.error("[proxy][fixtures] error:", err?.message ?? err);
    const message = err?.message ?? "Unknown error";
    const status = message === "Timeout" ? 504 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}