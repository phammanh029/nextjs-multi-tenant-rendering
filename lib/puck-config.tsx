import type { Config } from "@puckeditor/core";
import type { TenantManifest } from "./types";
import { ProductGrid } from "./components/ProductGrid";
import { ProductList } from "./components/ProductList";
import { ProductDetail } from "./components/ProductDetail";

const globalComponents = {
  ProductGrid: {
    fields: {
      title: { type: "text" },
    },
    render: ProductGrid,
  },
  ProductList: {
    fields: {
      title: { type: "text" },
    },
    render: ProductList,
  },
  ProductDetail: {
    fields: {},
    render: ProductDetail,
  },
} satisfies Config["components"];

export function buildTenantPuckConfig(tenant: TenantManifest): Config {
  const components: Config["components"] = {};

  for (const [name, rule] of Object.entries(tenant.allowedComponents)) {
    if (!rule.enabled) continue;

    const component = globalComponents[name as keyof typeof globalComponents];
    if (!component) continue;

    components[name] = component;
  }

  return { components };
}
