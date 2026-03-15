const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
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

    // Use Firecrawl to get HTML content
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
        formats: ['html', 'markdown', 'links'],
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

    const html = data.data?.html || data.html || '';
    const markdown = data.data?.markdown || data.markdown || '';
    const links = data.data?.links || data.links || [];
    const metadata = data.data?.metadata || data.metadata || {};

    // Inject selection script into HTML
    const selectionScript = `
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

  // Disable all links
  document.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); }, true);
  });
})();
</script>`;

    // Inject before </body>
    let modifiedHtml = html;
    if (modifiedHtml.includes('</body>')) {
      modifiedHtml = modifiedHtml.replace('</body>', selectionScript + '</body>');
    } else {
      modifiedHtml += selectionScript;
    }

    // Make all relative URLs absolute
    const baseUrl = new URL(formattedUrl);
    const baseHref = `<base href="${baseUrl.origin}/" target="_blank">`;
    if (modifiedHtml.includes('<head>')) {
      modifiedHtml = modifiedHtml.replace('<head>', '<head>' + baseHref);
    } else if (modifiedHtml.includes('<html>')) {
      modifiedHtml = modifiedHtml.replace('<html>', '<html><head>' + baseHref + '</head>');
    }

    return new Response(
      JSON.stringify({
        html: modifiedHtml,
        markdown: markdown.substring(0, 50000),
        links,
        metadata,
        sourceUrl: formattedUrl,
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
