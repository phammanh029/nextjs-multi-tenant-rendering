import type { Product } from "../types";

export function ProductDetail({ product }: { id?: string; product?: Product }) {
  if (!product) return <section className="detail" />;

  return (
    <section className="detail">
      <div className="imageBox">{product.emoji}</div>
      <div>
        <span className="badge">shared default detail layout</span>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <p className="price">€{product.price}</p>
      </div>
    </section>
  );
}
