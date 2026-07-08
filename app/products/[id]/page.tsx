import { Render } from "@puckeditor/core";
import type { Data } from "@puckeditor/core";
import { getPageData, getProduct } from "@/lib/data";
import { buildTenantPuckConfig } from "@/lib/puck-config";
import { resolveTenantFromHeaders } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await resolveTenantFromHeaders();
  const product = await getProduct(id);
  const config = buildTenantPuckConfig(tenant);
  const template = await getPageData(tenant.tenantId, "detail") as Data;

  const data: Data = {
    ...template,
    content: template.content.map((block) => ({
      ...block,
      props: { ...block.props, product },
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
        <a href="/">← Products</a>
        <span className="badge">tenant: {tenant.tenantId}</span>
      </div>
      <Render config={config} data={data} />
    </main>
  );
}
