import { Render } from "@puckeditor/core";
import type { Data } from "@puckeditor/core";
import { getPageData, getProducts } from "@/lib/data";
import { buildTenantPuckConfig } from "@/lib/puck-config";
import { resolveTenantFromHeaders } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tenant = await resolveTenantFromHeaders();
  const products = await getProducts();
  const config = buildTenantPuckConfig(tenant);
  const template = await getPageData(tenant.tenantId, "home") as Data;

  const data: Data = {
    ...template,
    content: template.content.map((block) => ({
      ...block,
      props: { ...block.props, products },
    })),
  };

  return (
    <main style={{
      "--bg": tenant.theme.background,
      "--fg": tenant.theme.foreground,
      "--card": tenant.theme.card,
      "--border": tenant.theme.border,
    } as React.CSSProperties}>
      <div className="header">
        <span className="badge">tenant: {tenant.tenantId}</span>
        <span className="badge">config v{tenant.configVersion}</span>
      </div>
      <Render config={config} data={data} />
    </main>
  );
}
