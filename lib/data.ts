import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { findPageData, findTenantByHost } from "./local-store";
import type { Product, TenantManifest } from "./types";

const root = process.cwd();

async function readJson<T>(relativePath: string): Promise<T> {
  const raw = await fs.readFile(path.join(root, relativePath), "utf8");
  return JSON.parse(raw) as T;
}

export async function getTenantByHost(host: string): Promise<TenantManifest> {
  const tenant = findTenantByHost(host);

  if (tenant) return tenant;

  notFound();
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
  const pageData = findPageData(tenantId, slug);

  if (pageData) return pageData;

  notFound();
}
