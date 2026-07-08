import { ProductListPage } from "./product-list-page";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  return <ProductListPage />;
}
