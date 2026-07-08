import Link from "next/link";
import type { Product } from "../types";

export function ProductGrid({ title, products = [] }: { id?: string; title?: string; products?: Product[] }) {
  return (
    <section>
      <div className="header">
        <h1>{title ?? "Products"}</h1>
        <span className="badge">grid layout</span>
      </div>

      <div className="grid">
        {products.map((product) => (
          <article className="card" key={product.id}>
            <div style={{ fontSize: 40 }}>{product.emoji}</div>
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <p className="price">€{product.price}</p>
            <Link href={`/products/${product.id}`}>View detail</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
