import { NextResponse } from "next/server";
import { resolveTenantFromHeaders } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET() {
  const tenant = await resolveTenantFromHeaders();

  return NextResponse.json({
    tenantId: tenant.tenantId,
    pod: process.env.HOSTNAME ?? "local-dev",
    pid: process.pid,
    time: new Date().toISOString()
  });
}
