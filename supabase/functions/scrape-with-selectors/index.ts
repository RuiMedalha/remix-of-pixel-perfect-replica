const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Lightweight HTML element extractor using regex (no WASM DOM parser)
function extractBySelector(html: string, selector: string): string[] {
  // Support simple selectors: tag, .class, #id, tag.class, [attr], tag[attr=val]
  const results: string[] = [];
  
  // Parse selector into tag + conditions
  let tag = '';
  let className = '';
  let id = '';
  let attr = '';
  let attrVal = '';

  const idMatch = selector.match(/#([\w-]+)/);
  if (idMatch) id = idMatch[1];
  
  const classMatch = selector.match(/\.([\w-]+)/);
  if (classMatch) className = classMatch[1];

  const attrMatch = selector.match(/\[([\w-]+)(?:=['"]?([^'"\]]+)['"]?)?\]/);
  if (attrMatch) { attr = attrMatch[1]; attrVal = attrMatch[2] || ''; }

  const tagMatch = selector.match(/^(\w+)/);
  if (tagMatch) tag = tagMatch[1].toLowerCase();

  // Build regex to find matching elements
  const tagPattern = tag || '[a-z][a-z0-9]*';
  const openTagRegex = new RegExp(
    `<(${tagPattern})(\\s[^>]*)?>([\\s\\S]*?)(?:<\\/\\1>|\\/>)`,
    'gi'
  );

  let match;
  while ((match = openTagRegex.exec(html)) !== null) {
    const [fullMatch, matchedTag, attrs = '', innerHTML = ''] = match;
    
    // Check id
    if (id && !new RegExp(`id\\s*=\\s*['"]${id}['"]`, 'i').test(attrs)) continue;
    // Check class
    if (className && !new RegExp(`class\\s*=\\s*['"][^'"]*\\b${className}\\b[^'"]*['"]`, 'i').test(attrs)) continue;
    // Check attribute
    if (attr) {
      if (attrVal) {
        if (!new RegExp(`${attr}\\s*=\\s*['"][^'"]*${attrVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^'"]*['"]`, 'i').test(attrs)) continue;
      } else {
        if (!new RegExp(`\\b${attr}\\b`, 'i').test(attrs)) continue;
      }
    }
    
    results.push(fullMatch);
    if (results.length > 200) break; // Safety limit
  }

  return results;
}

function getTextContent(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getAttribute(html: string, attr: string): string {
  const match = html.match(new RegExp(`${attr}\\s*=\\s*['"]([^'"]+)['"]`, 'i'));
  return match?.[1] || '';
}

function getInnerHTML(html: string): string {
  const match = html.match(/^<[^>]+>([\s\S]*)<\/[^>]+>$/);
  return match?.[1]?.trim() || '';
}

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

    // Process max 10 URLs per invocation to avoid memory limits
    for (const url of urls.slice(0, 10)) {
      try {
        let html = '';

        if (useFirecrawl && apiKey) {
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

        // Limit HTML size to prevent memory issues
        if (html.length > 2_000_000) {
          html = html.substring(0, 2_000_000);
        }

        const extracted: Record<string, string> = { source_url: url };

        for (const field of fields) {
          try {
            const elements = extractBySelector(html, field.selector);

            if (field.isVariation) {
              const values: string[] = [];
              for (const el of elements) {
                let val = '';
                switch (field.type) {
                  case 'image':
                    val = getAttribute(el, 'src') || '';
                    break;
                  case 'link':
                    val = getAttribute(el, 'href') || '';
                    break;
                  case 'html':
                    val = getInnerHTML(el);
                    break;
                  default:
                    val = getTextContent(el);
                }
                if (val && !values.includes(val)) values.push(val);
              }
              extracted[field.name] = values.join(' | ');
            } else {
              const el = elements[0];
              if (el) {
                switch (field.type) {
                  case 'image':
                    extracted[field.name] = getAttribute(el, 'src') || '';
                    break;
                  case 'link':
                    extracted[field.name] = getAttribute(el, 'href') || '';
                    break;
                  case 'html':
                    extracted[field.name] = getInnerHTML(el);
                    break;
                  default:
                    extracted[field.name] = getTextContent(el);
                }
              } else {
                extracted[field.name] = '';
              }
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
              const vals = extracted[field.name].split(' | ');
              extracted[field.name] = vals.map(v => {
                try { return new URL(v, baseUrl.origin).href; } catch { return v; }
              }).join(' | ');
            } catch { /* keep as-is */ }
          }
        }

        results.push(extracted);
        
        // Clear reference to free memory
        html = '';
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
