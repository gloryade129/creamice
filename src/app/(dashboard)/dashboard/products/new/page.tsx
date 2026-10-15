import { requireRole } from "@/lib/auth/session";
import { getCategories } from "@/lib/data/categories";
import { getStoreSettings } from "@/lib/data/settings";
import ProductForm from "@/components/ProductForm";

export default async function NewProductPage() {
  const user = await requireRole(["admin", "partner"]);

  const [categories, settings] = await Promise.all([
    getCategories(),
    getStoreSettings(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-oswald font-semibold text-2xl uppercase tracking-[0.02em]">
          New Product
        </h1>
        <p className="text-muted mt-1">Create a new product with sizes, stock and images.</p>
      </div>
      <ProductForm
        categories={categories}
        role={user.role}
        approvalRequired={settings.require_product_approval}
      />
    </div>
  );
}
