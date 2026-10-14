import { requireRole } from "@/lib/auth/session";
import ProductForm from "@/components/ProductForm";

export default async function NewProductPage() {
  await requireRole(["admin", "partner"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-oswald font-semibold text-2xl uppercase tracking-[0.02em]">
          New Product
        </h1>
        <p className="text-muted mt-1">Create a new product with variants and images.</p>
      </div>
      <ProductForm />
    </div>
  );
}