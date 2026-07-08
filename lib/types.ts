export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  emoji: string;
};

export type TenantManifest = {
  tenantId: string;
  displayName: string;
  hostnames: string[];
  configVersion: number;
  theme: {
    background: string;
    foreground: string;
    card: string;
    border: string;
  };
  allowedComponents: Record<string, { enabled: boolean }>;
};
