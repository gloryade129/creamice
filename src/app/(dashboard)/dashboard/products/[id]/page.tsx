import { requireRole } from "@/lib/auth/session";
import { getProduct } from "@/lib/data/products";
import { notFound } from "next/navigation";
import ProductForm from "@/components/ProductForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  await requireRole(["admin", "partner"]);

  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-oswald font-semibold text-2xl uppercase tracking-[0.02em]">
          Edit Product
        </h1>
        <p className="text-muted mt-1">{product.name}</p>
      </div>
      <ProductForm initialData={product} />
    </div>
  );
}