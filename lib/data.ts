import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Product, TenantManifest } from "./types";

const root = process.cwd();

async function readJson<T>(relativePath: string): Promise<T> {
  const raw = await fs.readFile(path.join(root, relativePath), "utf8");
  return JSON.parse(raw) as T;
}

export async function getTenantByHost(host: string): Promise<TenantManifest> {
  const cleanHost = host.split(":")[0]?.toLowerCase();
  const tenants = await readJson<TenantManifest[]>("data/tenants/tenants.json");
  const tenant = tenants.find((candidate) => candidate.hostnames.includes(cleanHost));

  if (!tenant) notFound();
  return tenant;
}

export async function getProducts(): Promise<Product[]> {
  return readJson<Product[]>("data/products/products.json");
}

export async function getProduct(id: string): Promise<Product> {
  const products = await getProducts();
  const product = products.find((candidate) => candidate.id === id);

  if (!product) notFound();
  return product;
}

export async function getPageData(tenantId: string, slug: "home" | "detail") {
  return readJson<unknown>(`data/pages/${tenantId}/${slug}.json`);
}
