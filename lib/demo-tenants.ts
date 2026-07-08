import type { TenantManifest } from "./types";

const maxDemoTenants = 1000;

const themes = [
  {
    background: "#ffffff",
    foreground: "#171717",
    card: "#f7f7f7",
    border: "#dddddd",
  },
  {
    background: "#f6fbff",
    foreground: "#102033",
    card: "#ffffff",
    border: "#bfd7ea",
  },
  {
    background: "#fffaf4",
    foreground: "#1d1712",
    card: "#ffffff",
    border: "#e3c9a8",
  },
  {
    background: "#f7fff8",
    foreground: "#132018",
    card: "#ffffff",
    border: "#b9d8c0",
  },
];

function parseDemoShopNumber(value: string): number | null {
  const cleanValue = value.split(":")[0]?.toLowerCase() ?? "";
  const match = cleanValue.match(/^shop-(\d+)\.puck\.local$/);

  if (!match) return null;

  const shopNumber = Number(match[1]);

  if (!Number.isInteger(shopNumber) || shopNumber < 1 || shopNumber > maxDemoTenants) {
    return null;
  }

  return shopNumber;
}

export function getDemoTenantByHost(host: string): TenantManifest | null {
  const shopNumber = parseDemoShopNumber(host);

  if (!shopNumber) return null;

  const tenantId = `shop-${shopNumber}`;
  const usesGrid = shopNumber % 2 === 1;

  return {
    tenantId,
    displayName: `Shop ${shopNumber}`,
    hostnames: [`${tenantId}.puck.local`],
    configVersion: 1,
    theme: themes[(shopNumber - 1) % themes.length],
    allowedComponents: {
      ProductGrid: { enabled: usesGrid },
      ProductList: { enabled: !usesGrid },
      ProductDetail: { enabled: true },
    },
  };
}

export function getDemoPageData(tenantId: string, slug: "home" | "detail") {
  const match = tenantId.match(/^shop-(\d+)$/);
  const shopNumber = match ? Number(match[1]) : 0;

  if (!Number.isInteger(shopNumber) || shopNumber < 1 || shopNumber > maxDemoTenants) {
    return null;
  }

  if (slug === "detail") {
    return {
      root: { props: {} },
      content: [
        {
          type: "ProductDetail",
          props: {
            id: `${tenantId}-product-detail`,
          },
        },
      ],
      zones: {},
    };
  }

  const componentType = shopNumber % 2 === 1 ? "ProductGrid" : "ProductList";

  return {
    root: { props: {} },
    content: [
      {
        type: componentType,
        props: {
          id: `${tenantId}-${componentType}`,
          title: `Shop ${shopNumber} Products`,
        },
      },
    ],
    zones: {},
  };
}
