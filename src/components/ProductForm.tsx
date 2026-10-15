"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader";
import { NAIRA_AMOUNT, PRODUCT_STATUSES, type ProductFormInput } from "@/lib/validation/products";
import { koboToNairaInput, nairaStringToKobo } from "@/lib/money";
import { generateSlug } from "@/lib/utils";
import { publicImageUrl } from "@/lib/images";
import { createProductAction, updateProductAction } from "@/lib/actions/products";
import type { Product } from "@/lib/data/products";
import type { UserRole } from "@/lib/types";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface FormVariant {
  size: string;
  color: string;
  sku: string;
  stock: number;
}

interface FormState {
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price_naira: string;
  compare_at_naira: string;
  status: Product["status"];
  is_featured: boolean;
  variants: FormVariant[];
  images: UploadedImage[];
}

const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];

const STATUSES: { value: Product["status"]; label: string }[] = PRODUCT_STATUSES.map((value) => ({
  value,
  label: value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" "),
}));

function createInitialFormState(initialData?: Product): FormState {
  if (!initialData) {
    return {
      category_id: "",
      name: "",
      slug: "",
      description: "",
      price_naira: "",
      compare_at_naira: "",
      status: "draft",
      is_featured: false,
      variants: DEFAULT_SIZES.map((size) => ({ size, color: "", sku: "", stock: 0 })),
      images: [],
    };
  }

  return {
    category_id: initialData.category_id || "",
    name: initialData.name || "",
    slug: initialData.slug || "",
    description: initialData.description || "",
    price_naira: koboToNairaInput(initialData.price_kobo),
    compare_at_naira:
      initialData.compare_at_price_kobo != null
        ? koboToNairaInput(initialData.compare_at_price_kobo)
        : "",
    status: initialData.status,
    is_featured: initialData.is_featured,
    variants:
      initialData.variants && initialData.variants.length > 0
        ? initialData.variants.map((v) => ({
            size: v.size || "",
            color: v.color || "",
            sku: v.sku || "",
            stock: v.stock || 0,
          }))
        : DEFAULT_SIZES.map((size) => ({ size, color: "", sku: "", stock: 0 })),
    images: (initialData.images || []).map((img) => ({
      storage_path: img.storage_path,
      public_url: publicImageUrl(img.storage_path) ?? "",
      alt_text: img.alt_text || "",
      sort_order: img.sort_order,
    })),
  };
}

interface ProductFormProps {
  initialData?: Product;
  categories: Category[];
  role: UserRole;
  approvalRequired: boolean;
}

export default function ProductForm({
  initialData,
  categories,
  role,
  approvalRequired,
}: ProductFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormState>(() => createInitialFormState(initialData));

  const isAdmin = role === "admin";
  const isLive = initialData?.status === "active";

  const update = (patch: Partial<FormState>) => setFormData((prev) => ({ ...prev, ...patch }));

  const handleName = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Keep filling the slug until the partner edits it by hand.
      slug: prev.slug ? prev.slug : generateSlug(name),
    }));
  };

  const handleVariantChange = (index: number, field: keyof FormVariant, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }));
  };

  const validate = (): string | null => {
    if (!formData.category_id) return "Choose a category";
    if (formData.name.trim().length < 2) return "Product name is too short";
    if (!formData.slug.trim()) return "Slug is required";
    if (!NAIRA_AMOUNT.test(formData.price_naira.trim())) return "Enter a valid price in naira";
    if (formData.compare_at_naira && !NAIRA_AMOUNT.test(formData.compare_at_naira.trim()))
      return "Enter a valid compare-at price in naira";
    if (
      formData.compare_at_naira &&
      nairaStringToKobo(formData.compare_at_naira.trim()) <=
        nairaStringToKobo(formData.price_naira.trim())
    )
      return "Compare-at price must be higher than the price";
    if (formData.variants.length === 0) return "Add at least one size";
    if (formData.variants.some((v) => !v.size.trim())) return "Every size needs a name";
    if (formData.variants.some((v) => !Number.isInteger(Number(v.stock)) || Number(v.stock) < 0))
      return "Stock must be a whole number of 0 or more";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: ProductFormInput = {
      category_id: formData.category_id,
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim(),
      price_naira: formData.price_naira.trim(),
      compare_at_price_naira: formData.compare_at_naira.trim(),
      variants: formData.variants.map((v) => ({
        size: v.size.trim(),
        color: v.color.trim(),
        sku: v.sku.trim(),
        stock: Number(v.stock),
      })),
      images: formData.images
        .filter((img) => img.storage_path)
        .map((img, index) => ({
          storage_path: img.storage_path,
          alt_text: (img.alt_text || "").trim(),
          sort_order: index,
        })),
      ...(isAdmin
        ? { status: formData.status, is_featured: formData.is_featured }
        : {}),
    };

    setSubmitting(true);
    try {
      const result = initialData
        ? await updateProductAction(initialData.id, payload)
        : await createProductAction(payload);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push(`/dashboard/products/${result.id}`);
      router.refresh();
    } catch {
      setError("Could not save the product. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {error && (
        <div className="p-4 bg-error/10 border border-error rounded-[4px] text-error" role="alert">
          {error}
        </div>
      )}

      {!isAdmin && approvalRequired && (
        <p className="p-4 bg-charcoal border border-border rounded-[4px] text-sm text-muted">
          {isLive
            ? "Name, price, description, category and image changes go to the admin for approval first. Stock and size changes save immediately."
            : "This product goes to the admin for approval before it appears in the shop."}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Select
            label="Category"
            value={formData.category_id}
            onChange={(e) => update({ category_id: e.target.value })}
            placeholder="Select category"
            required
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>

          <Input
            label="Product Name"
            value={formData.name}
            onChange={(e) => handleName(e.target.value)}
            placeholder="e.g. Black Hoodie"
            maxLength={120}
            required
          />

          <Input
            label="Slug"
            value={formData.slug}
            onChange={(e) => update({ slug: e.target.value })}
            placeholder="auto-generated from name"
            hint="URL-friendly identifier. Auto-generated from name if left empty."
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (₦)"
              type="text"
              inputMode="decimal"
              value={formData.price_naira}
              onChange={(e) => update({ price_naira: e.target.value })}
              placeholder="25000"
              hint="Enter in naira (saved as kobo)"
              required
            />
            <Input
              label="Compare at Price (₦)"
              type="text"
              inputMode="decimal"
              value={formData.compare_at_naira}
              onChange={(e) => update({ compare_at_naira: e.target.value })}
              placeholder="30000"
              hint="Original price for strikethrough display"
            />
          </div>

          {isAdmin && (
            <>
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => update({ status: e.target.value as Product["status"] })}
                required
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => update({ is_featured: e.target.checked })}
                  className="w-4 h-4 rounded-[2px] border-border-strong bg-charcoal text-gold focus:ring-gold"
                />
                <span className="font-montserrat text-sm">Featured product</span>
              </label>
            </>
          )}
        </div>

        <div>
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Product description..."
            rows={6}
            maxLength={4000}
          />
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="font-oswald font-semibold text-lg uppercase tracking-[0.02em] mb-4">
          Sizes &amp; Stock
        </h3>
        <div className="space-y-3">
          <div className="hidden sm:grid sm:grid-cols-12 gap-3 text-sm text-muted">
            <div className="col-span-4 font-montserrat font-medium">Size</div>
            <div className="col-span-3 font-montserrat font-medium">Colour (optional)</div>
            <div className="col-span-2 font-montserrat font-medium">SKU (optional)</div>
            <div className="col-span-2 font-montserrat font-medium">Stock</div>
            <div className="col-span-1" />
          </div>
          {formData.variants.map((variant, i) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-12 gap-3">
              <div className="col-span-2 sm:col-span-4">
                <Select
                  value={variant.size}
                  onChange={(e) => handleVariantChange(i, "size", e.target.value)}
                  placeholder="Size"
                  aria-label={`Size ${i + 1}`}
                >
                  {DEFAULT_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  {variant.size && !DEFAULT_SIZES.includes(variant.size) && (
                    <option value={variant.size}>{variant.size}</option>
                  )}
                </Select>
              </div>
              <div className="sm:col-span-3">
                <Input
                  value={variant.color}
                  onChange={(e) => handleVariantChange(i, "color", e.target.value)}
                  placeholder="Colour"
                  aria-label={`Colour ${i + 1}`}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  value={variant.sku}
                  onChange={(e) => handleVariantChange(i, "sku", e.target.value)}
                  placeholder="SKU"
                  aria-label={`SKU ${i + 1}`}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={variant.stock}
                  onChange={(e) => handleVariantChange(i, "stock", Number(e.target.value))}
                  placeholder="Stock"
                  aria-label={`Stock for size ${i + 1}`}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      variants: prev.variants.filter((_, index) => index !== i),
                    }))
                  }
                  className="w-full sm:w-auto text-error hover:text-error"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                variants: [...prev.variants, { size: "", color: "", sku: "", stock: 0 }],
              }))
            }
          >
            + Add Size
          </Button>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="font-oswald font-semibold text-lg uppercase tracking-[0.02em] mb-4">
          Images
        </h3>
        <p className="text-sm text-muted mb-4">
          Upload product images. They are resized to 1600px WebP in the browser. The first image is
          the main product image.
        </p>
        <ImageUploader
          value={formData.images}
          onChange={(updater) => setFormData((prev) => ({ ...prev, images: updater(prev.images) }))}
          productId={initialData?.id}
          maxFiles={10}
        />
      </div>

      <div className="flex flex-wrap gap-4 border-t border-border pt-6">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initialData ? "Save Changes" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
