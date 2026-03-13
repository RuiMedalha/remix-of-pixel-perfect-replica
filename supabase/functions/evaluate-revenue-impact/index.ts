import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { workspaceId } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const [{ data: bundles }, { data: pricing }, { data: promos }] = await Promise.all([
      supabase.from("bundle_recommendations").select("*").eq("workspace_id", workspaceId).order("expected_revenue", { ascending: false }).limit(20),
      supabase.from("pricing_recommendations").select("*").eq("workspace_id", workspaceId).limit(20),
      supabase.from("promotion_candidates").select("*").eq("workspace_id", workspaceId).limit(20),
    ]);

    const actions: any[] = [];
    (bundles || []).forEach((b: any) => actions.push({ workspace_id: workspaceId, action_type: "create_bundle", action_payload: b.bundle_products, expected_revenue: b.expected_revenue, status: "pending" }));
    (pricing || []).filter((p: any) => Math.abs(p.recommended_price - p.current_price) > p.current_price * 0.05).forEach((p: any) => actions.push({ workspace_id: workspaceId, action_type: "adjust_price", action_payload: { product_id: p.product_id, current: p.current_price, recommended: p.recommended_price }, expected_revenue: Math.abs(p.recommended_price - p.current_price) * 10, status: "pending" }));
    (promos || []).forEach((p: any) => actions.push({ workspace_id: workspaceId, action_type: "launch_promotion", action_payload: { product_id: p.product_id, type: p.promotion_type }, expected_revenue: p.estimated_revenue_gain, status: "pending" }));

    if (actions.length > 0) await supabase.from("revenue_actions").insert(actions.slice(0, 100));

    // Feed brain
    const brainObs = actions.slice(0, 10).map((a: any) => ({ workspace_id: workspaceId, observation_type: "revenue_signal", signal_source: "revenue_optimization", signal_strength: 70, signal_payload: { action_type: a.action_type, expected_revenue: a.expected_revenue }, processed: false }));
    if (brainObs.length > 0) await supabase.from("catalog_brain_observations").insert(brainObs).catch(() => {});

    return new Response(JSON.stringify({ actions: Math.min(actions.length, 100) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
});
