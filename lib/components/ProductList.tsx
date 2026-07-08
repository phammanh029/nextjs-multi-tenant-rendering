import Link from "next/link";
import type { Product } from "../types";

export function ProductList({ title, products = [] }: { id?: string; title?: string; products?: Product[] }) {
  return (
    <section>
      <div className="header">
        <h1>{title ?? "Products"}</h1>
        <span className="badge">list layout</span>
      </div>

      <div className="list">
        {products.map((product) => (
          <article className="listItem" key={product.id}>
            <div>
              <strong>{product.emoji} {product.name}</strong>
              <p>{product.description}</p>
            </div>
            <div className="price">€{product.price}</div>
            <Link href={`/products/${product.id}`}>View detail</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
