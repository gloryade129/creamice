import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Outside the try: requireRole redirects, and the catch must not turn that
  // redirect into a 500.
  await requireRole(["admin", "partner"]);

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const productId = formData.get("productId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "webp";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const storagePath = `product-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(storagePath);

    let sortOrder = 0;
    if (productId) {
      const { data: existingImages } = await supabase
        .from("product_images")
        .select("sort_order")
        .eq("product_id", productId)
        .order("sort_order", { ascending: false })
        .limit(1);

      if (existingImages && existingImages.length > 0) {
        sortOrder = (existingImages[0].sort_order || 0) + 1;
      }
    }

    return NextResponse.json({
      storage_path: storagePath,
      public_url: urlData.publicUrl,
      sort_order: sortOrder,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  await requireRole(["admin", "partner"]);

  try {
    const { searchParams } = new URL(request.url);
    const storagePath = searchParams.get("path");

    if (!storagePath) {
      return NextResponse.json({ error: "No path provided" }, { status: 400 });
    }
    // Only files in our own folder can be targeted by the path parameter.
    if (!storagePath.startsWith("product-images/") || storagePath.includes("..")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase.storage
      .from("product-images")
      .remove([storagePath]);

    if (error) {
      console.error("Storage delete error:", error);
      return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}