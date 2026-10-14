"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ImageUploader } from "@/components/ImageUploader";
import { getCategories } from "@/lib/data/categories";
import { createProduct, generateSlug } from "@/lib/data/products";
import type { Product } from "@/lib/data/products";

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

interface FormImage {
  storage_path: string;
  public_url: string;
  sort_order: number;
  alt_text?: string;
}

interface FormData {
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price_kobo: string;
  compare_at_price_kobo: string;
  status: "draft" | "pending_approval" | "active" | "upcoming" | "archived";
  is_featured: boolean;
  variants: FormVariant[];
  images: FormImage[];
}

const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];
const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "active", label: "Active" },
  { value: "upcoming", label: "Upcoming" },
  { value: "archived", label: "Archived" },
] as const;

function createInitialFormData(initialData?: Product): FormData {
  if (!initialData) {
    return {
      category_id: "",
      name: "",
      slug: "",
      description: "",
      price_kobo: "",
      compare_at_price_kobo: "",
      status: "draft",
      is_featured: false,
      variants: DEFAULT_SIZES.map((size) => ({
        size,
        color: "",
        sku: "",
        stock: 0,
      })),
      images: [],
    };
  }

  return {
    category_id: initialData.category_id || "",
    name: initialData.name || "",
    slug: initialData.slug || "",
    description: initialData.description || "",
    price_kobo: initialData.price_kobo?.toString() || "",
    compare_at_price_kobo: initialData.compare_at_price_kobo?.toString() || "",
    status: initialData.status || "draft",
    is_featured: initialData.is_featured || false,
    variants: initialData.variants && initialData.variants.length > 0
      ? initialData.variants.map((v) => ({
          size: v.size || "",
          color: v.color || "",
          sku: v.sku || "",
          stock: v.stock || 0,
        }))
      : DEFAULT_SIZES.map((size) => ({ size, color: "", sku: "", stock: 0 })),
    images: (initialData.images || []).map((img) => ({
      storage_path: img.storage_path,
      public_url: img.storage_path ? `/api/storage/${img.storage_path}` : "",
      alt_text: img.alt_text || "",
      sort_order: img.sort_order,
    })),
  };
}

export default function ProductForm({ initialData }: { initialData?: Product }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>(() => createInitialFormData(initialData));

  useEffect(() => {
    let mounted = true;
    getCategories().then((data) => {
      if (mounted) setCategories(data);
    }).catch((err) => {
      console.error("Failed to load categories:", err);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(createInitialFormData(initialData));
    }
  }, [initialData]);

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "name" && !formData.slug && typeof value === "string") {
      setFormData((prev) => ({ ...prev, slug: generateSlug(value) }));
    }
  };

  const handleVariantChange = (index: number, field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }));
  };

  const handleImageChange = (index: number, field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => (i === index ? { ...img, [field]: value } : img)),
    }));
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { size: "", color: "", sku: "", stock: 0 }],
    }));
  };

  const removeVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const validate = (): string | null => {
    if (!formData.category_id) return "Category is required";
    if (!formData.name.trim()) return "Product name is required";
    if (!formData.slug.trim()) return "Slug is required";
    if (!formData.price_kobo || Number(formData.price_kobo) <= 0) return "Price must be greater than 0";
    if (formData.variants.some((v) => !v.size.trim())) return "All variants must have a size";
    if (formData.variants.some((v) => Number(v.stock) < 0)) return "Stock cannot be negative";
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

    setSubmitting(true);
    try {
      const product = await createProduct({
        category_id: formData.category_id,
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        price_kobo: Number(formData.price_kobo),
        compare_at_price_kobo: formData.compare_at_price_kobo ? Number(formData.compare_at_price_kobo) : null,
        status: formData.status,
        is_featured: formData.is_featured,
        created_by: "",
        variants: formData.variants.filter((v) => v.size.trim()).map((v) => ({
          size: v.size,
          color: v.color || undefined,
          sku: v.sku || undefined,
          stock: Number(v.stock),
        })),
        images: formData.images.filter((img) => img.storage_path.trim()).map((img) => ({
          storage_path: img.storage_path,
          alt_text: img.alt_text || "",
          sort_order: img.sort_order,
        })),
      });

      router.push(`/dashboard/products/${product.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Select
            label="Category"
            value={formData.category_id}
            onChange={(e) => handleChange("category_id", e.target.value)}
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
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g. Black Hoodie"
            required
          />

          <Input
            label="Slug"
            value={formData.slug}
            onChange={(e) => handleChange("slug", e.target.value)}
            placeholder="auto-generated from name"
            hint="URL-friendly identifier. Auto-generated from name if left empty."
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (₦)"
              type="number"
              value={formData.price_kobo}
              onChange={(e) => handleChange("price_kobo", e.target.value)}
              placeholder="25000"
              hint="Enter in naira (converted to kobo)"
              required
            />
            <Input
              label="Compare at Price (₦)"
              type="number"
              value={formData.compare_at_price_kobo}
              onChange={(e) => handleChange("compare_at_price_kobo", e.target.value)}
              placeholder="30000"
              hint="Original price for strikethrough display"
            />
          </div>

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => handleChange("status", e.target.value)}
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
              onChange={(e) => handleChange("is_featured", e.target.checked)}
              className="w-4 h-4 rounded-[2px] border-border-strong bg-charcoal text-gold focus:ring-gold"
            />
            <span className="font-montserrat text-sm">Featured product</span>
          </label>
        </div>

        <div>
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Product description..."
            rows={6}
          />
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="font-oswald font-semibold text-lg uppercase tracking-[0.02em] mb-4">Variants (Size & Stock)</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-3 text-sm text-muted">
            <div className="col-span-4 font-montserrat font-medium">Size</div>
            <div className="col-span-3 font-montserrat font-medium">Colour (optional)</div>
            <div className="col-span-2 font-montserrat font-medium">SKU (optional)</div>
            <div className="col-span-2 font-montserrat font-medium">Stock</div>
            <div className="col-span-1"></div>
          </div>
          {formData.variants.map((variant, i) => (
            <div key={i} className="grid grid-cols-12 gap-3">
              <Select
                value={variant.size}
                onChange={(e) => handleVariantChange(i, "size", e.target.value)}
                placeholder="Size"
              >
                {DEFAULT_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <Input
                value={variant.color}
                onChange={(e) => handleVariantChange(i, "color", e.target.value)}
                placeholder="Colour"
              />
              <Input
                value={variant.sku}
                onChange={(e) => handleVariantChange(i, "sku", e.target.value)}
                placeholder="SKU"
              />
              <Input
                type="number"
                min="0"
                value={variant.stock}
                onChange={(e) => handleVariantChange(i, "stock", Number(e.target.value))}
                placeholder="0"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeVariant(i)}
                className="text-error hover:text-error"
              >
                Remove
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={addVariant}>
            + Add Variant
          </Button>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="font-oswald font-semibold text-lg uppercase tracking-[0.02em] mb-4">Images</h3>
        <p className="text-sm text-muted mb-4">Upload product images. They will be auto-resized to 1600px WebP. First image is the main product image.</p>
        <ImageUploader
          value={formData.images}
          onChange={(images) => setFormData((prev) => ({ ...prev, images }))}
          productId=""
          maxFiles={10}
        />
      </div>

      <div className="flex gap-4 border-t border-border pt-6">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initialData ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}