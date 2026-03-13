import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { jobId } = await req.json();
    if (!jobId) throw new Error("jobId required");

    // Load job
    const { data: job, error: jobErr } = await supabase
      .from("ingestion_jobs")
      .select("*")
      .eq("id", jobId)
      .single();
    if (jobErr || !job) throw new Error("Job not found");

    const workspaceId = job.workspace_id;
    const strategy = job.merge_strategy || "merge";

    // Update status to importing
    await supabase.from("ingestion_jobs").update({
      status: "importing",
      mode: "live",
      started_at: new Date().toISOString(),
    }).eq("id", jobId);

    // Load items
    const { data: items, error: itemsErr } = await supabase
      .from("ingestion_job_items")
      .select("*")
      .eq("job_id", jobId)
      .order("source_row_index", { ascending: true });

    if (itemsErr) throw itemsErr;
    if (!items || items.length === 0) throw new Error("No items to process");

    let imported = 0, updated = 0, skipped = 0, failed = 0;

    for (const item of items) {
      try {
        const mapped = item.mapped_data || item.source_data || {};
        const action = item.action;

        if (action === "skip" || action === "duplicate") {
          await supabase.from("ingestion_job_items").update({ status: "skipped" }).eq("id", item.id);
          skipped++;
          continue;
        }

        // Build product data
        const productData: Record<string, any> = {
          workspace_id: workspaceId,
          user_id: user.id,
        };

        // Map known fields
        const fieldMap: Record<string, string> = {
          original_title: "original_title",
          title: "original_title",
          original_description: "original_description",
          description: "original_description",
          short_description: "short_description",
          sku: "sku",
          category: "category",
          original_price: "original_price",
          price: "original_price",
          sale_price: "sale_price",
          image_urls: "image_urls",
          tags: "tags",
          meta_title: "meta_title",
          meta_description: "meta_description",
          seo_slug: "seo_slug",
          supplier_ref: "supplier_ref",
          technical_specs: "technical_specs",
          product_type: "product_type",
          attributes: "attributes",
        };

        for (const [src, dst] of Object.entries(fieldMap)) {
          if (mapped[src] !== undefined && mapped[src] !== null && mapped[src] !== "") {
            let val = mapped[src];
            // Handle arrays
            if (dst === "image_urls" || dst === "tags") {
              if (typeof val === "string") {
                val = val.split(",").map((s: string) => s.trim()).filter(Boolean);
              }
            }
            // Handle numbers
            if (dst === "original_price" || dst === "sale_price") {
              val = parseFloat(String(val).replace(",", "."));
              if (isNaN(val)) continue;
            }
            productData[dst] = val;
          }
        }

        // Store extra fields in attributes
        const knownKeys = new Set([...Object.keys(fieldMap), "id", "workspace_id", "user_id"]);
        const extras: Record<string, any> = {};
        for (const [k, v] of Object.entries(mapped)) {
          if (!knownKeys.has(k) && v !== undefined && v !== null && v !== "") {
            extras[k] = v;
          }
        }
        if (Object.keys(extras).length > 0) {
          productData.attributes = { ...(productData.attributes || {}), ...extras };
        }

        let productId: string | null = null;

        if ((action === "update" || action === "merge") && item.matched_existing_id) {
          // Update existing
          const updateData = { ...productData };
          delete updateData.workspace_id;
          delete updateData.user_id;

          if (strategy === "replace") {
            // Full replace
          } else {
            // Merge: only non-empty fields
          }

          const { error: updateErr } = await supabase
            .from("products")
            .update(updateData)
            .eq("id", item.matched_existing_id);

          if (updateErr) throw updateErr;
          productId = item.matched_existing_id;
          updated++;
        } else if (action === "insert") {
          // Handle parent/child grouping
          if (item.is_parent === false && item.parent_group_key) {
            // Find parent product
            const { data: parentItem } = await supabase
              .from("ingestion_job_items")
              .select("product_id")
              .eq("job_id", jobId)
              .eq("parent_group_key", item.parent_group_key)
              .eq("is_parent", true)
              .not("product_id", "is", null)
              .limit(1)
              .single();

            if (parentItem?.product_id) {
              productData.parent_product_id = parentItem.product_id;
              productData.product_type = "variation";
            }
          } else if (item.is_parent) {
            productData.product_type = "variable";
          }

          const { data: newProduct, error: insertErr } = await supabase
            .from("products")
            .insert(productData)
            .select("id")
            .single();

          if (insertErr) throw insertErr;
          productId = newProduct.id;
          imported++;
        }

        await supabase.from("ingestion_job_items").update({
          status: "processed",
          product_id: productId,
        }).eq("id", item.id);

        // Update progress
        await supabase.from("ingestion_jobs").update({
          imported_rows: imported,
          updated_rows: updated,
          skipped_rows: skipped,
          failed_rows: failed,
        }).eq("id", jobId);

      } catch (itemErr) {
        failed++;
        await supabase.from("ingestion_job_items").update({
          status: "error",
          error_message: itemErr.message,
        }).eq("id", item.id);
      }
    }

    // Complete job
    await supabase.from("ingestion_jobs").update({
      status: "done",
      imported_rows: imported,
      updated_rows: updated,
      skipped_rows: skipped,
      failed_rows: failed,
      completed_at: new Date().toISOString(),
      results: { imported, updated, skipped, failed },
    }).eq("id", jobId);

    return new Response(JSON.stringify({
      success: true,
      jobId,
      imported,
      updated,
      skipped,
      failed,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
