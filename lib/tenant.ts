import { headers } from "next/headers";
import { getTenantByHost } from "./data";

export async function resolveTenantFromHeaders() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");

  if (!host) {
    throw new Error("Missing host header");
  }

  return getTenantByHost(host);
}
