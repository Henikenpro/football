// lib/api.ts
import { format } from "date-fns";

export function formatDateISO(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export const fetcher = async (input: RequestInfo) => {
  const res = await fetch(input);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // throw Error to make useSWR show error state
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return res.json();
};