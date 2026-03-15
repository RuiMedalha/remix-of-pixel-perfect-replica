const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser as DenoDOM } from "https://deno.land/x/deno_dom@v0.1.48/deno-dom-wasm.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { urls, fields, workspaceId, templateName, useFirecrawl = false } = await req.json();

    if (!urls?.length || !fields?.length) {
      return new Response(
        JSON.stringify({ error: 'URLs e campos são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const results: any[] = [];
    const errors: any[] = [];
    let firecrawlCreditsUsed = 0;

    for (const url of urls.slice(0, 100)) {
      try {
        let html = '';

        if (useFirecrawl && apiKey) {
          // Paid: Firecrawl for JS-heavy sites
          const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, formats: ['html'], onlyMainContent: false }),
          });

          if (!response.ok) {
            errors.push({ url, error: `Firecrawl HTTP ${response.status}` });
            continue;
          }

          const data = await response.json();
          html = data.data?.html || data.html || '';
          firecrawlCreditsUsed++;
        } else {
          // FREE: Native fetch
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
            },
            redirect: 'follow',
          });

          if (!response.ok) {
            errors.push({ url, error: `HTTP ${response.status}` });
            continue;
          }

          html = await response.text();
        }

        // Parse HTML and extract data using selectors
        const doc = new DenoDOM().parseFromString(html, 'text/html');
        if (!doc) {
          errors.push({ url, error: 'Failed to parse HTML' });
          continue;
        }

        const extracted: Record<string, string> = { source_url: url };

        for (const field of fields) {
          try {
            const el = doc.querySelector(field.selector);
            if (el) {
              switch (field.type) {
                case 'image':
                  extracted[field.name] = el.getAttribute('src') || el.querySelector('img')?.getAttribute('src') || '';
                  break;
                case 'link':
                  extracted[field.name] = el.getAttribute('href') || '';
                  break;
                case 'html':
                  extracted[field.name] = el.innerHTML || '';
                  break;
                default:
                  extracted[field.name] = el.textContent?.trim() || '';
              }
            } else {
              extracted[field.name] = '';
            }
          } catch {
            extracted[field.name] = '';
          }
        }

        // Make relative URLs absolute
        const baseUrl = new URL(url);
        for (const field of fields) {
          if ((field.type === 'image' || field.type === 'link') && extracted[field.name]) {
            try {
              extracted[field.name] = new URL(extracted[field.name], baseUrl.origin).href;
            } catch { /* keep as-is */ }
          }
        }

        results.push(extracted);
      } catch (err) {
        errors.push({ url, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    // Track scraping credits if Firecrawl was used
    if (firecrawlCreditsUsed > 0 && workspaceId) {
      try {
        await supabase.rpc('increment_scraping_credits', { _workspace_id: workspaceId });
      } catch { /* non-critical */ }
    }

    // Save template if requested
    if (templateName && workspaceId) {
      await supabase.from('scraping_templates').upsert({
        workspace_id: workspaceId,
        user_id: user.id,
        template_name: templateName,
        fields,
        sample_url: urls[0],
        updated_at: new Date().toISOString(),
      } as any, { onConflict: 'workspace_id,template_name' });
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        errors,
        total: urls.length,
        extracted: results.length,
        failed: errors.length,
        firecrawlCreditsUsed,
        method: useFirecrawl ? 'firecrawl' : 'native',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
