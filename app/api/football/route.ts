import { NextResponse } from "next/server";
import { footballFetch } from "../../../lib/api";

export async function GET(req: Request) {
  // Simple proxy: forward query parameters to API-Football
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());

  try {
    const data = await footballFetch("/fixtures", params);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}