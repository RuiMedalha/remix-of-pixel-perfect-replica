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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { urls, fields, workspaceId, templateName } = await req.json();
    // fields: Array<{ name: string, selector: string, type: 'text' | 'image' | 'link' | 'html' }>
    // urls: string[]

    if (!urls?.length || !fields?.length) {
      return new Response(
        JSON.stringify({ error: 'URLs e campos são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Firecrawl não está configurado.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: any[] = [];
    const errors: any[] = [];

    // Process URLs sequentially to avoid rate limits
    for (const url of urls.slice(0, 50)) {
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats: ['html'],
            onlyMainContent: false,
          }),
        });

        if (!response.ok) {
          errors.push({ url, error: `HTTP ${response.status}` });
          continue;
        }

        const data = await response.json();
        const html = data.data?.html || data.html || '';

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

        results.push(extracted);
      } catch (err) {
        errors.push({ url, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    // Save template if requested
    if (templateName && workspaceId) {
      await supabase.from('scraping_templates').upsert({
        workspace_id: workspaceId,
        user_id: user.id,
        template_name: templateName,
        fields: fields,
        sample_url: urls[0],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'workspace_id,template_name' });
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        errors,
        total: urls.length,
        extracted: results.length,
        failed: errors.length,
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
