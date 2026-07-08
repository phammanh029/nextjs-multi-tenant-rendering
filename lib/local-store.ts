import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getDemoPageData, getDemoTenantByHost } from "./demo-tenants";
import type { TenantManifest } from "./types";

const root = process.cwd();
const maxDemoTenants = 1000;

let database: DatabaseSync | null = null;

type JsonRow = {
  json: string;
};

function readJsonFile<T>(relativePath: string): T {
  const raw = fs.readFileSync(path.join(root, relativePath), "utf8");
  return JSON.parse(raw) as T;
}

function createDatabase() {
  const db = new DatabaseSync(":memory:");

  db.exec(`
    CREATE TABLE tenants (
      tenant_id TEXT PRIMARY KEY,
      manifest_json TEXT NOT NULL
    );

    CREATE TABLE tenant_hosts (
      host TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants (tenant_id)
    );

    CREATE TABLE pages (
      tenant_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      page_json TEXT NOT NULL,
      PRIMARY KEY (tenant_id, slug),
      FOREIGN KEY (tenant_id) REFERENCES tenants (tenant_id)
    );
  `);

  seedStaticTenants(db);
  seedDemoTenants(db);

  return db;
}

function getDatabase() {
  database ??= createDatabase();
  return database;
}

function insertTenant(db: DatabaseSync, tenant: TenantManifest) {
  db.prepare("INSERT INTO tenants (tenant_id, manifest_json) VALUES (?, ?)")
    .run(tenant.tenantId, JSON.stringify(tenant));

  const insertHost = db.prepare("INSERT INTO tenant_hosts (host, tenant_id) VALUES (?, ?)");

  for (const host of tenant.hostnames) {
    insertHost.run(host.toLowerCase(), tenant.tenantId);
  }
}

function insertPage(db: DatabaseSync, tenantId: string, slug: "home" | "detail", pageData: unknown) {
  db.prepare("INSERT INTO pages (tenant_id, slug, page_json) VALUES (?, ?, ?)")
    .run(tenantId, slug, JSON.stringify(pageData));
}

function seedStaticTenants(db: DatabaseSync) {
  const tenants = readJsonFile<TenantManifest[]>("data/tenants/tenants.json");

  for (const tenant of tenants) {
    insertTenant(db, tenant);

    for (const slug of ["home", "detail"] as const) {
      insertPage(db, tenant.tenantId, slug, readJsonFile(`data/pages/${tenant.tenantId}/${slug}.json`));
    }
  }
}

function seedDemoTenants(db: DatabaseSync) {
  for (let shopNumber = 1; shopNumber <= maxDemoTenants; shopNumber++) {
    const host = `shop-${shopNumber}.puck.local`;
    const tenant = getDemoTenantByHost(host);

    if (!tenant) continue;

    insertTenant(db, tenant);
    insertPage(db, tenant.tenantId, "home", getDemoPageData(tenant.tenantId, "home"));
    insertPage(db, tenant.tenantId, "detail", getDemoPageData(tenant.tenantId, "detail"));
  }
}

export function findTenantByHost(host: string): TenantManifest | null {
  const cleanHost = host.split(":")[0]?.toLowerCase();

  if (!cleanHost) return null;

  const row = getDatabase()
    .prepare(`
      SELECT tenants.manifest_json AS json
      FROM tenant_hosts
      JOIN tenants ON tenants.tenant_id = tenant_hosts.tenant_id
      WHERE tenant_hosts.host = ?
    `)
    .get(cleanHost) as JsonRow | undefined;

  return row ? JSON.parse(row.json) as TenantManifest : null;
}

export function findPageData(tenantId: string, slug: "home" | "detail") {
  const row = getDatabase()
    .prepare("SELECT page_json AS json FROM pages WHERE tenant_id = ? AND slug = ?")
    .get(tenantId, slug) as JsonRow | undefined;

  return row ? JSON.parse(row.json) as unknown : null;
}
