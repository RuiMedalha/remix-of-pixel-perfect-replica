const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, useFirecrawl = false, mode = 'browse' } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    let html = '';
    let metadata: Record<string, string> = {};
    let fetchMethod = 'native';

    if (useFirecrawl) {
      const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'Firecrawl não está configurado.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: formattedUrl,
          formats: ['html'],
          onlyMainContent: false,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: data.error || `Erro ${response.status}` }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      html = data.data?.html || data.html || '';
      metadata = data.data?.metadata || data.metadata || {};
      fetchMethod = 'firecrawl';
    } else {
      const response = await fetch(formattedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: `Erro HTTP ${response.status}. Tente ativar o modo Firecrawl.` }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      html = await response.text();
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      metadata = { title: titleMatch?.[1]?.trim() || formattedUrl };
      fetchMethod = 'native';
    }

    // Make all relative URLs absolute
    const baseUrl = new URL(formattedUrl);
    const baseHref = `<base href="${baseUrl.origin}/" target="_self">`;

    let modifiedHtml = html;

    // Inject base href
    if (modifiedHtml.includes('<head>')) {
      modifiedHtml = modifiedHtml.replace('<head>', '<head>' + baseHref);
    } else if (modifiedHtml.includes('<html')) {
      modifiedHtml = modifiedHtml.replace(/<html[^>]*>/, (match) => match + '<head>' + baseHref + '</head>');
    } else {
      modifiedHtml = '<head>' + baseHref + '</head>' + modifiedHtml;
    }

    // Inject cookie banner removal + the appropriate script based on mode
    const cookieScript = buildCookieRemovalScript();
    const script = mode === 'select' ? buildSelectionScript() : buildBrowseScript();

    if (modifiedHtml.includes('</body>')) {
      modifiedHtml = modifiedHtml.replace('</body>', script + '</body>');
    } else {
      modifiedHtml += script;
    }

    return new Response(
      JSON.stringify({
        html: modifiedHtml,
        metadata,
        sourceUrl: formattedUrl,
        fetchMethod,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Browse mode: let user navigate, intercept clicks to notify parent
function buildBrowseScript(): string {
  return `
<script>
(function() {
  // Intercept all link clicks and form submissions to go through proxy
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a[href]');
    if (link) {
      e.preventDefault();
      e.stopPropagation();
      const href = link.href;
      if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
        window.parent.postMessage({
          type: 'navigate',
          url: href,
        }, '*');
      }
      return false;
    }
  }, true);

  // Disable form submissions
  document.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();
  }, true);
})();
</script>`;
}

// Select mode: highlight + select elements
function buildSelectionScript(): string {
  return `
<style>
  .lv-hover-highlight {
    outline: 2px solid #3b82f6 !important;
    outline-offset: 2px !important;
    cursor: crosshair !important;
  }
  .lv-selected {
    outline: 3px solid #10b981 !important;
    outline-offset: 2px !important;
    background-color: rgba(16, 185, 129, 0.1) !important;
  }
</style>
<script>
(function() {
  let hoveredEl = null;
  
  function getCssSelector(el) {
    if (!el || el === document.body || el === document.documentElement) return 'body';
    const parts = [];
    let current = el;
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        selector = '#' + current.id;
        parts.unshift(selector);
        break;
      }
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\\s+/)
          .filter(c => !c.startsWith('lv-'))
          .slice(0, 2);
        if (classes.length) selector += '.' + classes.join('.');
      }
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
        if (siblings.length > 1) {
          const idx = siblings.indexOf(current) + 1;
          selector += ':nth-of-type(' + idx + ')';
        }
      }
      parts.unshift(selector);
      current = current.parentElement;
    }
    return parts.join(' > ');
  }

  document.addEventListener('mouseover', function(e) {
    if (hoveredEl) hoveredEl.classList.remove('lv-hover-highlight');
    hoveredEl = e.target;
    if (!hoveredEl.classList.contains('lv-selected')) {
      hoveredEl.classList.add('lv-hover-highlight');
    }
  });

  document.addEventListener('mouseout', function(e) {
    if (hoveredEl) hoveredEl.classList.remove('lv-hover-highlight');
  });

  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    const el = e.target;
    const isSelected = el.classList.contains('lv-selected');
    
    if (isSelected) {
      el.classList.remove('lv-selected');
      window.parent.postMessage({
        type: 'element-deselected',
        selector: getCssSelector(el),
      }, '*');
    } else {
      el.classList.add('lv-selected');
      el.classList.remove('lv-hover-highlight');
      
      const text = el.innerText?.trim().substring(0, 500) || '';
      const src = el.src || el.querySelector('img')?.src || '';
      const href = el.href || '';
      const tagName = el.tagName.toLowerCase();
      
      window.parent.postMessage({
        type: 'element-selected',
        selector: getCssSelector(el),
        text: text,
        src: src,
        href: href,
        tagName: tagName,
        outerHTML: el.outerHTML?.substring(0, 300) || '',
      }, '*');
    }
    return false;
  }, true);
})();
</script>`;
}
