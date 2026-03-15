import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Globe, Loader2, Play, Eye, Zap, Coins, Brain, CheckCircle2,
  AlertTriangle, ArrowRight, ArrowLeft, RefreshCw, Layers, ChevronRight,
  Target, Wand2, Plus, Download, Navigation, Crosshair, ExternalLink,
  MousePointerClick, Trash2, List, X, Upload, FileSpreadsheet,
  Type, Image as ImageIcon, Link2, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceContext } from "@/hooks/useWorkspaces";
import { useWebsiteExtractionAgent } from "@/hooks/useWebsiteExtractionAgent";
import { DEFAULT_PRODUCT_FIELDS } from "@/hooks/useUploadCatalog";

/* ────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────── */

interface SelectedField {
  id: string;
  name: string;
  selector: string;
  type: "text" | "image" | "link" | "html";
  preview: string;
  isVariation?: boolean;
}

type LinkType = "categoria" | "grupo" | "produto" | "outro";

interface ExtractedLink {
  url: string;
  text: string;
  selected: boolean;
  linkType: LinkType;
}

interface SiteLayer {
  label: string;
  links: ExtractedLink[];
  sourceUrl: string;
  hasPagination: boolean;
  paginationUrls: string[];
}

type AgentStep =
  | "url"           // 1. Enter URL
  | "browse"        // 2. Browse & classify page links (categories/products)
  | "categories"    // 3. View/select category layers, mark pagination
  | "products"      // 4. Collected product URLs
  | "fields"        // 5. Open product page, select/map fields
  | "extract"       // 6. Run extraction
  | "results";      // 7. Results

/* ────────────────────────────────────────────────
   Link classification helpers
   ──────────────────────────────────────────────── */

const NAV_URL_HINT = /(contact|about|legal|privacy|terms|cookies|gdpr|faq|blog|news|cart|checkout|account|login|search|facebook|instagram|linkedin|youtube|twitter|tiktok|pinterest)/i;
const PRODUCT_URL_HINT = /(\/product(s)?\/|\/produto(s)?\/|\/p\/|\/item\/|\/model\/|\/md\d+|\.html$)/i;
const CATEGORY_URL_HINT = /(\/categor(y|ies)\/|\/categoria(s)?\/|\/collection(s)?\/|\/grupo(s)?\/|\/range\/|\/gama\/|\/famil(y|ies)\/|\/shop\/|our-products|nos-produits|nuestros-productos)/i;
const GROUP_URL_HINT = /(\/group(s)?\/|\/groupe(s)?\/|\/family|\/familia|\/series|\/linha|\/gama)/i;
const NON_HTML_FILE_HINT = /\.(jpg|jpeg|png|webp|gif|svg|pdf|zip|rar|mp4|mp3|webm|avi|css|js)(\?|$)/i;
const TRACKING_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
const STRICT_NAV_HINT = /^(contact|about|legal|privacy|terms|cookies|login|cart|checkout|search|account)$/i;

const canonicalizeUrl = (rawUrl: string): string => {
  try {
    const parsed = new URL(rawUrl);
    parsed.hash = '';
    TRACKING_PARAMS.forEach(param => parsed.searchParams.delete(param));
    parsed.pathname = parsed.pathname.replace(/\/+/g, '/');
    if (parsed.pathname.length > 1) parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    return parsed.toString();
  } catch { return rawUrl; }
};

const classifyLinkFromDoc = (anchor: Element, fullUrl: string, includeAll: boolean): 'product' | 'category' | 'navigation' | 'other' => {
  const classes = (typeof anchor.className === 'string' ? anchor.className : '').toLowerCase();
  const href = (anchor.getAttribute('href') || '').toLowerCase();
  const text = (anchor.textContent || '').toLowerCase().trim();
  const normalizedUrl = fullUrl.toLowerCase();

  if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return 'navigation';
  if (NON_HTML_FILE_HINT.test(normalizedUrl)) return 'other';
  
  // Always check product/category patterns FIRST (even in nav)
  if (PRODUCT_URL_HINT.test(normalizedUrl)) return 'product';
  if (CATEGORY_URL_HINT.test(normalizedUrl)) return 'category';
  if (GROUP_URL_HINT.test(normalizedUrl)) return 'category';
  
  const PRODUCT_CLASSES = ['productteaser', 'product-teaser', 'product-card', 'product-item', 'product-link'];
  const CATEGORY_CLASSES = ['categoryproductteaser', 'category-teaser', 'category-card', 'category-link'];
  if (PRODUCT_CLASSES.some(c => classes.includes(c))) return 'product';
  if (CATEGORY_CLASSES.some(c => classes.includes(c))) return 'category';
  
  // Only filter out strict navigation (external social, login, etc.)
  if (!includeAll) {
    if (STRICT_NAV_HINT.test(text)) return 'navigation';
    if (/^(facebook|instagram|linkedin|youtube|twitter|tiktok)\.com/i.test(new URL(fullUrl).hostname)) return 'navigation';
  }

  return 'other';
};

/* ────────────────────────────────────────────────
   Auto-detect field selectors
   ──────────────────────────────────────────────── */
const FIELD_DETECTION_RULES: { name: string; selectors: string[]; type: SelectedField["type"]; isVariation?: boolean }[] = [
  { name: "Título", selectors: ["h1.product_title", "h1.product-title", "h1[itemprop='name']", ".ProductTop-title", "h1.entry-title", "h1"], type: "text" },
  { name: "Referência", selectors: [".ProductMain-features-ref", ".sku", "[itemprop='sku']", ".product-sku", ".product-reference"], type: "text" },
  { name: "Preço", selectors: [".price ins .amount", ".price .amount", "[itemprop='price']", ".product-price", ".woocommerce-Price-amount", ".price"], type: "text" },
  { name: "Descrição", selectors: [".ProductMain-desc-content", ".woocommerce-product-details__short-description", "#tab-description", "[itemprop='description']", ".product-description"], type: "html" },
  { name: "Imagem Principal", selectors: [".ProductMain-images-slider-item img", ".woocommerce-product-gallery__image img", ".product-image img", "[itemprop='image']", ".wp-post-image"], type: "image" },
  { name: "Galeria Imagens", selectors: [".ProductMain-images-slider-item:not(:first-child) img", ".woocommerce-product-gallery__image:not(:first-child) img", ".product-thumbnails img", ".gallery-item img"], type: "image", isVariation: true },
  { name: "Características", selectors: [".Features-list", ".ProductMain-features-list table", ".product-specs", ".specifications", ".tech-specs"], type: "html" },
  { name: "Categoria", selectors: [".posted_in a", "[itemprop='category']", ".breadcrumb a:last-child"], type: "text" },
  { name: "Marca", selectors: ["[itemprop='brand']", ".product-brand", ".brand a"], type: "text" },
  { name: "Documentos", selectors: [".btn-download a", "a[href$='.pdf']"], type: "link", isVariation: true },
];

/* ────────────────────────────────────────────────
   Step labels
   ──────────────────────────────────────────────── */
const STEP_CONFIG: { key: AgentStep; label: string; icon: typeof Globe }[] = [
  { key: "url", label: "URL", icon: Globe },
  { key: "browse", label: "Navegar", icon: Navigation },
  { key: "categories", label: "Categorias", icon: Layers },
  { key: "products", label: "Produtos", icon: Target },
  { key: "fields", label: "Campos", icon: Crosshair },
  { key: "extract", label: "Extrair", icon: Play },
  { key: "results", label: "Resultados", icon: CheckCircle2 },
];

/* ════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════ */

export default function WebsiteExtractionAgentPage() {
  const { activeWorkspace } = useWorkspaceContext();
  const agent = useWebsiteExtractionAgent();

  const [step, setStep] = useState<AgentStep>("url");
  const [url, setUrl] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [navHistory, setNavHistory] = useState<string[]>([]);

  // Cost control
  const [useFirecrawl, setUseFirecrawl] = useState(false);

  // Layers of categories
  const [layers, setLayers] = useState<SiteLayer[]>([]);
  const [currentLinks, setCurrentLinks] = useState<ExtractedLink[]>([]);
  const [linkFilter, setLinkFilter] = useState("");
  const [includeAllLinks, setIncludeAllLinks] = useState(true); // Show ALL links by default

  // Collected product URLs
  const [productUrls, setProductUrls] = useState<string[]>([]);
  const [collectProgress, setCollectProgress] = useState<{ current: number; total: number; label?: string; pages?: number } | null>(null);

  // Pagination config
  const [paginationMode, setPaginationMode] = useState<"auto" | "pattern">("auto");
  const [paginationPattern, setPaginationPattern] = useState("");
  const [maxPagesPerCategory, setMaxPagesPerCategory] = useState(50);
  const [showPaginationConfig, setShowPaginationConfig] = useState(false);

  // Fields
  const [fields, setFields] = useState<SelectedField[]>([]);
  const [iframeMode, setIframeMode] = useState<"browse" | "select">("browse");

  // Results
  const [results, setResults] = useState<Record<string, string>[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // Send to ingestion
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [scraperMapping, setScraperMapping] = useState<Record<string, string>>({});

  // File import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for selection messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "navigate") {
        loadPage(e.data.url, "browse");
      } else if (e.data?.type === "element-selected") {
        const { selector, text, src, href, tagName } = e.data;
        let type: SelectedField["type"] = "text";
        let preview = text || "";
        if (tagName === "img" || src) { type = "image"; preview = src || ""; }
        else if (tagName === "a" || href) { type = "link"; preview = href || text || ""; }
        setFields(prev => [...prev, {
          id: crypto.randomUUID(),
          name: `Campo ${prev.length + 1}`,
          selector, type,
          preview: preview.substring(0, 200),
          isVariation: false,
        }]);
        toast.success("Elemento selecionado!", { description: preview.substring(0, 80) });
      } else if (e.data?.type === "element-deselected") {
        setFields(prev => prev.filter(f => f.selector !== e.data.selector));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [fields.length, useFirecrawl]);

  /* ── Page loading ── */
  const loadPage = async (targetUrl: string, mode: "browse" | "select") => {
    if (!targetUrl.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("proxy-page", {
        body: { url: targetUrl.trim(), useFirecrawl, mode },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setHtmlContent(data.html);
      setCurrentUrl(data.sourceUrl);
      setPageTitle(data.metadata?.title || targetUrl);
      setIframeMode(mode);
      if (mode === "browse") {
        setNavHistory(prev => [...prev, data.sourceUrl]);
        if (step === "url") setStep("browse");
      }
    } catch (err: any) {
      toast.error("Erro ao carregar página", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (navHistory.length > 1) {
      const prev = navHistory[navHistory.length - 2];
      setNavHistory(h => h.slice(0, -1));
      loadPage(prev, iframeMode);
    }
  };

  /* ── Extract links from a URL ── */
  const extractLinksFromPage = async (pageUrl: string): Promise<{ links: ExtractedLink[]; nextPages: string[] }> => {
    const { data: proxyData } = await supabase.functions.invoke("proxy-page", {
      body: { url: pageUrl, useFirecrawl, mode: "browse" },
    });
    if (!proxyData?.html) return { links: [], nextPages: [] };

    const parser = new DOMParser();
    const doc = parser.parseFromString(proxyData.html, "text/html");
    const anchors = doc.querySelectorAll("a[href]");
    const baseUrl = new URL(pageUrl);
    const links: ExtractedLink[] = [];
    const seen = new Set<string>();

    anchors.forEach(a => {
      try {
        const href = a.getAttribute("href") || "";
        if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
        const fullUrl = canonicalizeUrl(new URL(href, pageUrl).href);
        if (seen.has(fullUrl) || fullUrl === canonicalizeUrl(pageUrl)) return;
        seen.add(fullUrl);
        // Only keep same-domain links
        if (new URL(fullUrl).hostname !== baseUrl.hostname) return;

        const linkType = classifyLinkFromDoc(a, fullUrl, includeAllLinks);
        // In includeAll mode, only skip pure navigation (# / javascript / mailto)
        // In filtered mode, skip navigation classified links
        if (!includeAllLinks && linkType === 'navigation') return;

        const cleanText = (a.textContent || a.getAttribute("aria-label") || a.getAttribute("title") || "")
          .trim().replace(/\s+/g, ' ').substring(0, 120);

        const inferredType: LinkType = linkType === 'product' ? 'produto'
          : (linkType === 'category' || GROUP_URL_HINT.test(fullUrl.toLowerCase())) ? 'categoria' 
          : linkType === 'navigation' ? 'outro' : 'outro';

        links.push({ url: fullUrl, text: cleanText, selected: linkType === 'product' || linkType === 'category', linkType: inferredType });
      } catch { /* ignore */ }
    });

    // Detect pagination
    const paginationSelectors = [
      'a.next', 'a.next-page', '.pagination a', 'nav.pagination a', 'a[rel="next"]',
      '.woocommerce-pagination a', '.page-numbers a', 'a[aria-label*="next" i]',
      'a[aria-label*="próx" i]', '.pager a', '.paginator a', '.nav-links a',
    ];
    const nextPages: string[] = [];
    const seenPages = new Set<string>();
    paginationSelectors.forEach(sel => {
      try {
        doc.querySelectorAll(sel).forEach(el => {
          const href = el.getAttribute("href");
          if (href) {
            try {
              const full = new URL(href, baseUrl.origin).href;
              if (!seenPages.has(full) && full !== pageUrl) { seenPages.add(full); nextPages.push(full); }
            } catch { /* ignore */ }
          }
        });
      } catch { /* ignore */ }
    });

    // Fallback pagination detection
    if (nextPages.length === 0) {
      doc.querySelectorAll("a[href]").forEach(a => {
        const text = (a.textContent || "").trim().toLowerCase();
        const href = a.getAttribute("href");
        if (!href) return;
        const isPageLink = /^(next|suivant|próxima?|seguinte|last|›|»|\d+)$/i.test(text)
          || /[?&]page=\d/i.test(href) || /\/page\/\d/i.test(href);
        if (isPageLink) {
          try {
            const full = new URL(href, baseUrl.origin).href;
            if (!seenPages.has(full) && full !== pageUrl && new URL(full).hostname === baseUrl.hostname) {
              seenPages.add(full); nextPages.push(full);
            }
          } catch { /* ignore */ }
        }
      });
    }

    return { links, nextPages };
  };

  /* ── Deep crawl: recursively discover ALL internal links ── */
  const handleDeepCrawl = async () => {
    setLoading(true);
    try {
      const crawled = new Set<string>();
      const allLinks: ExtractedLink[] = [];
      const allLinkUrls = new Set<string>();
      const queue = [currentUrl];
      const maxCrawl = 100;
      let processed = 0;

      while (queue.length > 0 && crawled.size < maxCrawl) {
        const batch = queue.splice(0, 3);
        const results = await Promise.allSettled(batch.map(async u => {
          if (crawled.has(u)) return { links: [] as ExtractedLink[], nextPages: [] as string[] };
          crawled.add(u);
          return extractLinksFromPage(u);
        }));

        results.forEach(r => {
          if (r.status === "fulfilled") {
            r.value.links.forEach(link => {
              if (!allLinkUrls.has(link.url)) {
                allLinkUrls.add(link.url);
                allLinks.push(link);
                // Queue internal pages for further crawling
                if (link.linkType === "categoria" || link.linkType === "grupo") {
                  if (!crawled.has(link.url) && !queue.includes(link.url)) queue.push(link.url);
                }
              }
            });
          }
        });

        processed += batch.length;
        setCollectProgress({ current: processed, total: Math.min(processed + queue.length, maxCrawl), label: `Crawl profundo: ${allLinks.length} links`, pages: processed });
      }

      setCurrentLinks(allLinks);
      setLayers([{
        label: `Crawl completo (${crawled.size} páginas)`,
        links: allLinks,
        sourceUrl: currentUrl,
        hasPagination: false,
        paginationUrls: [],
      }]);
      setStep("categories");
      setCollectProgress(null);

      const cats = allLinks.filter(l => l.linkType === "categoria" || l.linkType === "grupo").length;
      const prods = allLinks.filter(l => l.linkType === "produto").length;
      toast.success(`Crawl completo: ${allLinks.length} links (${cats} categorias · ${prods} produtos) de ${crawled.size} páginas`);
    } catch (err: any) {
      toast.error("Erro no crawl", { description: err.message });
    } finally {
      setLoading(false);
      setCollectProgress(null);
    }
  };

  /* ── Step: Browse → Extract links ── */
  const handleExtractLinks = async () => {
    setLoading(true);
    try {
      const { links, nextPages } = await extractLinksFromPage(currentUrl);
      setCurrentLinks(links);
      setLayers([{
        label: pageTitle || currentUrl,
        links,
        sourceUrl: currentUrl,
        hasPagination: nextPages.length > 0,
        paginationUrls: nextPages,
      }]);
      setStep("categories");
      const cats = links.filter(l => l.linkType === "categoria" || l.linkType === "grupo").length;
      const prods = links.filter(l => l.linkType === "produto").length;
      toast.success(`${links.length} links (${cats} categorias · ${prods} produtos)`);
    } catch (err: any) {
      toast.error("Erro ao extrair links", { description: err.message });
    } finally { setLoading(false); }
  };

  /* ── Drill into selected categories (add new layer) ── */
  const handleDrillInto = async (urls: string[]) => {
    if (urls.length === 0) { toast.error("Selecione pelo menos uma categoria."); return; }
    setLoading(true);
    try {
      const allLinks: ExtractedLink[] = [];
      const allNextPages: string[] = [];
      const seen = new Set<string>();

      for (let i = 0; i < urls.length; i += 5) {
        const batch = urls.slice(i, i + 5);
        const results = await Promise.allSettled(batch.map(u => extractLinksFromPage(u)));
        results.forEach(r => {
          if (r.status === "fulfilled") {
            r.value.links.forEach(link => {
              if (!seen.has(link.url)) { seen.add(link.url); allLinks.push(link); }
            });
            r.value.nextPages.forEach(p => { if (!seen.has(p)) { seen.add(p); allNextPages.push(p); } });
          }
        });
        if (urls.length > 5) toast.info(`Progresso: ${Math.min(i + 5, urls.length)}/${urls.length}`);
      }

      const newLayer: SiteLayer = {
        label: `Nível ${layers.length + 1} (${urls.length} páginas)`,
        links: allLinks,
        sourceUrl: urls[0],
        hasPagination: allNextPages.length > 0,
        paginationUrls: allNextPages,
      };

      setLayers(prev => [...prev, newLayer]);
      setCurrentLinks(allLinks);
      toast.success(`${allLinks.length} links de ${urls.length} páginas`);
    } catch (err: any) {
      toast.error("Erro ao explorar", { description: err.message });
    } finally { setLoading(false); }
  };

  /* ── Generate pagination URLs from a pattern ── */
  const generatePaginationUrls = (baseUrl: string, pattern: string, maxPages: number): string[] => {
    const urls: string[] = [];
    for (let n = 2; n <= maxPages; n++) {
      const pageStr = pattern.replace(/\{n\}/g, String(n));
      try {
        const base = new URL(baseUrl);
        if (pageStr.startsWith("?") || pageStr.startsWith("&")) {
          const paramParts = pageStr.replace(/^[?&]/, "").split("=");
          if (paramParts.length === 2) base.searchParams.set(paramParts[0], paramParts[1]);
          urls.push(base.toString());
        } else if (pageStr.startsWith("/")) {
          base.pathname = base.pathname.replace(/\/+$/, "") + pageStr;
          urls.push(base.toString());
        } else {
          urls.push(baseUrl.replace(/\/$/, "") + pageStr);
        }
      } catch { urls.push(baseUrl.replace(/\/$/, "") + pageStr); }
    }
    return urls;
  };

  /* ── Auto-detect pagination pattern ── */
  const autoDetectPaginationPattern = (nextPages: string[], baseUrl: string): string | null => {
    if (nextPages.length === 0) return null;
    try {
      const base = new URL(baseUrl);
      for (const np of nextPages) {
        const page = new URL(np);
        for (const [key, val] of page.searchParams.entries()) {
          if (/^\d+$/.test(val) && !base.searchParams.has(key)) return `?${key}={n}`;
        }
        const baseParts = base.pathname.split("/").filter(Boolean);
        const pageParts = page.pathname.split("/").filter(Boolean);
        if (pageParts.length > baseParts.length) {
          const diff = pageParts.slice(baseParts.length);
          if (diff.length === 1 && /^\d+$/.test(diff[0])) return `/page/{n}`;
          if (diff.length === 2 && diff[0] === "page" && /^\d+$/.test(diff[1])) return `/page/{n}/`;
        }
      }
    } catch { /* ignore */ }
    return null;
  };

  /* ── Follow pagination on current layer ── */
  const handleFollowPagination = async () => {
    const currentLayer = layers[layers.length - 1];
    if (!currentLayer) return;
    setLoading(true);
    try {
      let remaining = [...currentLayer.paginationUrls];
      const crawled = new Set<string>();
      const existingUrls = new Set(currentLinks.map(l => l.url));
      let newLinks: ExtractedLink[] = [];
      let totalNew = 0;

      if (paginationMode === "pattern" && paginationPattern && remaining.length === 0) {
        remaining = generatePaginationUrls(currentLayer.sourceUrl, paginationPattern, maxPagesPerCategory);
      }

      while (remaining.length > 0 && crawled.size < maxPagesPerCategory) {
        const targetUrl = remaining.shift()!;
        if (crawled.has(targetUrl)) continue;
        crawled.add(targetUrl);

        const { links, nextPages } = await extractLinksFromPage(targetUrl);
        const unique = links.filter(l => !existingUrls.has(l.url));
        if (unique.length === 0 && crawled.size > 1) break;
        unique.forEach(l => existingUrls.add(l.url));
        newLinks = [...newLinks, ...unique];
        totalNew += unique.length;

        if (paginationMode === "auto") {
          nextPages.forEach(p => { if (!crawled.has(p) && !remaining.includes(p)) remaining.push(p); });
        }
      }

      setCurrentLinks(prev => [...prev, ...newLinks]);
      setLayers(prev => {
        const updated = [...prev];
        const last = { ...updated[updated.length - 1] };
        last.links = [...last.links, ...newLinks];
        last.paginationUrls = remaining;
        last.hasPagination = remaining.length > 0;
        updated[updated.length - 1] = last;
        return updated;
      });

      toast.success(`+${totalNew} links de ${crawled.size} páginas de paginação`);
    } catch (err: any) {
      toast.error("Erro na paginação", { description: err.message });
    } finally { setLoading(false); }
  };

  /* ── Collect all product URLs ── */
  const handleCollectProducts = () => {
    const prods = currentLinks.filter(l => l.linkType === "produto" && l.selected).map(l => l.url);
    if (prods.length === 0) { toast.error("Nenhum produto selecionado."); return; }
    setProductUrls(prods);
    setStep("products");
    toast.success(`${prods.length} URLs de produto recolhidas`);
  };

  /* ── Auto-collect: drill all categories with full pagination ── */
  const handleAutoCollect = async () => {
    const catUrls = currentLinks.filter(l => (l.linkType === "categoria" || l.linkType === "grupo") && l.selected).map(l => l.url);
    if (catUrls.length === 0 && currentLinks.filter(l => l.linkType === "produto").length === 0) {
      toast.error("Nenhuma categoria ou produto encontrado.");
      return;
    }

    setLoading(true);
    setCollectProgress({ current: 0, total: catUrls.length || 1, label: "A iniciar...", pages: 0 });

    try {
      let allProductUrls: string[] = [];
      const seen = new Set<string>();
      let totalPagesProcessed = 0;

      currentLinks.filter(l => l.linkType === "produto").forEach(l => {
        if (!seen.has(l.url)) { seen.add(l.url); allProductUrls.push(l.url); }
      });

      for (let i = 0; i < catUrls.length; i++) {
        const catUrl = catUrls[i];
        const catLabel = currentLinks.find(l => l.url === catUrl)?.text || `Cat ${i + 1}`;
        setCollectProgress({ current: i + 1, total: catUrls.length, label: catLabel, pages: totalPagesProcessed });

        try {
          const crawledPages = new Set<string>();
          let pageUrl: string | null = catUrl;
          let detectedPattern: string | null = null;
          let patternGenerated = false;

          while (pageUrl && crawledPages.size < maxPagesPerCategory) {
            crawledPages.add(pageUrl);
            totalPagesProcessed++;
            setCollectProgress({ current: i + 1, total: catUrls.length, label: `${catLabel} (pág ${crawledPages.size})`, pages: totalPagesProcessed });

            const { links, nextPages } = await extractLinksFromPage(pageUrl);
            const productsBefore = allProductUrls.length;
            links.filter(l => l.linkType === "produto").forEach(l => {
              if (!seen.has(l.url)) { seen.add(l.url); allProductUrls.push(l.url); }
            });
            if (crawledPages.size > 1 && allProductUrls.length === productsBefore) break;

            let nextPage: string | null = null;

            if (paginationMode === "pattern" && paginationPattern) {
              if (!patternGenerated) {
                const paginationUrls = generatePaginationUrls(catUrl, paginationPattern, maxPagesPerCategory);
                paginationUrls.forEach(u => { if (!crawledPages.has(u)) nextPages.push(u); });
                patternGenerated = true;
              }
              nextPage = nextPages.find(p => !crawledPages.has(p)) || null;
            } else {
              if (!detectedPattern && nextPages.length > 0) {
                detectedPattern = autoDetectPaginationPattern(nextPages, catUrl);
              }
              nextPage = nextPages.find(p => !crawledPages.has(p)) || null;
              if (!nextPage && detectedPattern && crawledPages.size < maxPagesPerCategory) {
                const generatedUrls = generatePaginationUrls(catUrl, detectedPattern, maxPagesPerCategory);
                nextPage = generatedUrls.find(u => !crawledPages.has(u)) || null;
              }
            }

            pageUrl = nextPage;
          }
        } catch { /* skip failed category */ }
      }

      setProductUrls(allProductUrls);
      setCollectProgress(null);
      setStep("products");
      toast.success(`${allProductUrls.length} URLs de produto de ${catUrls.length} categorias (${totalPagesProcessed} páginas)`);
    } catch (err: any) {
      toast.error("Erro na recolha automática", { description: err.message });
    } finally {
      setLoading(false);
      setCollectProgress(null);
    }
  };

  /* ── Open a product page for field selection ── */
  const handleOpenProductForFields = (productUrl?: string) => {
    const target = productUrl || productUrls[0];
    if (!target) return;
    loadPage(target, "select");
    setStep("fields");
  };

  /* ── Auto-detect fields ── */
  const handleAutoDetectFields = () => {
    if (!htmlContent) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const detected: SelectedField[] = [];

    for (const spec of FIELD_DETECTION_RULES) {
      for (const sel of spec.selectors) {
        try {
          const el = doc.querySelector(sel);
          if (el) {
            let preview = "";
            if (spec.type === "image") preview = el.getAttribute("src") || el.querySelector("img")?.getAttribute("src") || "";
            else preview = (el.textContent || "").trim().substring(0, 200);
            if (preview && preview.length > 1) {
              detected.push({ id: crypto.randomUUID(), name: spec.name, selector: sel, type: spec.type, preview, isVariation: spec.isVariation || false });
              break;
            }
          }
        } catch { /* invalid selector */ }
      }
    }

    if (detected.length > 0) {
      setFields(prev => {
        const existing = new Set(prev.map(f => f.name));
        return [...prev, ...detected.filter(d => !existing.has(d.name))];
      });
      toast.success(`${detected.length} campos detetados`);
    } else {
      toast.info("Não foi possível detetar campos. Selecione-os manualmente.");
    }
  };

  /* ── Run batch extraction ── */
  const handleRunExtraction = async () => {
    if (fields.length === 0) { toast.error("Defina pelo menos um campo."); return; }
    const urls = productUrls.length > 0 ? productUrls : [currentUrl];
    setBatchLoading(true);
    setStep("extract");

    try {
      const allResults: Record<string, string>[] = [];
      const allErrors: any[] = [];

      for (let i = 0; i < urls.length; i += 5) {
        const chunk = urls.slice(i, i + 5);
        setCollectProgress({ current: i + chunk.length, total: urls.length });

        const { data, error } = await supabase.functions.invoke("scrape-with-selectors", {
          body: {
            urls: chunk,
            fields: fields.map(f => ({ name: f.name, selector: f.selector, type: f.type, isVariation: f.isVariation })),
            workspaceId: activeWorkspace?.id,
            useFirecrawl,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        allResults.push(...(data.results || []));
        allErrors.push(...(data.errors || []));
      }

      setResults(allResults);
      setErrors(allErrors);
      setCollectProgress(null);
      setStep("results");
      toast.success(`${allResults.length} produtos extraídos`);
    } catch (err: any) {
      toast.error("Erro na extração", { description: err.message });
    } finally {
      setBatchLoading(false);
      setCollectProgress(null);
    }
  };

  /* ── Export Excel ── */
  const handleExportExcel = () => {
    if (results.length === 0) return;
    import("xlsx").then(XLSX => {
      const ws = XLSX.utils.json_to_sheet(results);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Products");
      XLSX.writeFile(wb, "extraction-results.xlsx");
    });
  };

  /* ── Send to ingestion ── */
  const handleSendToProducts = async () => {
    if (!activeWorkspace?.id || results.length === 0) return;
    if (!Object.values(scraperMapping).includes("title")) { toast.error("Mapeie pelo menos o Título."); return; }
    setBatchLoading(true);
    try {
      const { data: job, error: jobError } = await supabase
        .from("ingestion_jobs")
        .insert({
          workspace_id: activeWorkspace.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          source_type: "api" as any,
          source_ref: currentUrl,
          status: "pending" as any,
          config: { type: "website_extraction_agent", fields: fields.map(f => f.name), mapping: scraperMapping },
        } as any)
        .select("id")
        .single();
      if (jobError) throw jobError;

      const items = results.map((row, idx) => {
        const mapped: Record<string, string> = {};
        Object.entries(scraperMapping).forEach(([k, v]) => { if (v && v !== "__ignore__" && row[k]) mapped[v] = row[k]; });
        return { job_id: job.id, item_index: idx, source_data: row, mapped_data: mapped, status: "pending" as any };
      });

      for (let i = 0; i < items.length; i += 50) {
        await supabase.from("ingestion_job_items").insert(items.slice(i, i + 50) as any);
      }

      toast.success(`Job de ingestão criado com ${results.length} itens!`);
      setShowSendDialog(false);
    } catch (err: any) {
      toast.error("Erro ao criar job", { description: err.message });
    } finally { setBatchLoading(false); }
  };

  /* ── Helpers ── */
  const toggleLink = (url: string) => setCurrentLinks(prev => prev.map(l => l.url === url ? { ...l, selected: !l.selected } : l));
  const changeLinkType = (url: string, type: LinkType) => setCurrentLinks(prev => prev.map(l => l.url === url ? { ...l, linkType: type } : l));
  const removeProductUrl = (url: string) => setProductUrls(prev => prev.filter(u => u !== url));

  const categoryLinks = currentLinks.filter(l => l.linkType === "categoria" || l.linkType === "grupo");
  const productLinksInView = currentLinks.filter(l => l.linkType === "produto");
  const selectedCats = currentLinks.filter(l => (l.linkType === "categoria" || l.linkType === "grupo") && l.selected);
  const filteredLinks = currentLinks.filter(l => !linkFilter || l.url.toLowerCase().includes(linkFilter.toLowerCase()) || l.text.toLowerCase().includes(linkFilter.toLowerCase()));
  const currentLayer = layers[layers.length - 1];

  const typeIcons: Record<string, React.ReactNode> = {
    text: <Type className="w-3 h-3" />, image: <ImageIcon className="w-3 h-3" />,
    link: <Link2 className="w-3 h-3" />, html: <FileText className="w-3 h-3" />,
  };

  /* ════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════ */
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-0">
      {/* Top toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-background flex-shrink-0">
        <BotIcon className="w-5 h-5 text-primary" />
        <span className="font-semibold text-sm">Website Extraction Agent</span>

        {/* Step indicators */}
        <div className="flex gap-1 ml-3">
          {STEP_CONFIG.map(s => (
            <Badge key={s.key} variant={step === s.key ? "default" : "outline"} className="text-[10px] px-1.5 py-0">
              {s.label}
            </Badge>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {useFirecrawl ? (
            <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">
              <Zap className="w-3 h-3 mr-1" /> Premium
            </Badge>
          ) : (
            <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-[10px]">
              <Coins className="w-3 h-3 mr-1" /> Gratuito
            </Badge>
          )}
          <Switch checked={useFirecrawl} onCheckedChange={setUseFirecrawl} className="scale-75" />
        </div>
      </div>

      {/* ═══ STEP: URL Entry ═══ */}
      {step === "url" && (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Iniciar Extração — Passo 1
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Insira o URL da homepage ou página de categorias do fornecedor. Vai poder navegar, identificar as camadas de categorias, recolher URLs de produtos e depois definir os campos a extrair.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="https://fornecedor.com"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && loadPage(url, "browse")}
                  className="font-mono text-sm"
                />
                <Button onClick={() => loadPage(url, "browse")} disabled={loading || !url.trim()}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  <span className="ml-1">Abrir</span>
                </Button>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" /> Ou importe URLs de produtos directamente
                </p>
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.txt" onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    file.text().then(text => {
                      const urls = text.split(/[\r\n,;]+/).map(u => u.trim().replace(/^["']|["']$/g, ""))
                        .filter(u => u.startsWith("http://") || u.startsWith("https://"));
                      if (urls.length === 0) { toast.error("Nenhum URL encontrado."); return; }
                      setProductUrls(urls);
                      setStep("products");
                      toast.success(`${urls.length} URLs importadas`);
                    });
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }} className="hidden" />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-1" /> Importar CSV/Excel
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-muted/30 space-y-2 text-xs text-muted-foreground">
                <p className="font-medium text-foreground text-sm">Fluxo por camadas:</p>
                <div className="flex items-center gap-1"><Badge variant="outline" className="text-[10px]">1</Badge> Navegar o site e extrair links</div>
                <div className="flex items-center gap-1"><Badge variant="outline" className="text-[10px]">2</Badge> Classificar links como categorias (níveis) ou produtos</div>
                <div className="flex items-center gap-1"><Badge variant="outline" className="text-[10px]">3</Badge> Entrar nas categorias → marcar paginação → recolher produtos</div>
                <div className="flex items-center gap-1"><Badge variant="outline" className="text-[10px]">4</Badge> Abrir um produto → selecionar/mapear campos visualmente</div>
                <div className="flex items-center gap-1"><Badge variant="outline" className="text-[10px]">5</Badge> Executar extração em lote</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ STEP: Browse (iframe + address bar) ═══ */}
      {(step === "browse" || step === "fields") && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/30 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleGoBack} disabled={navHistory.length <= 1 || loading}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => loadPage(currentUrl, iframeMode)} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <div className="flex-1 flex items-center gap-2 bg-background border rounded-md px-3 py-1 text-xs font-mono text-muted-foreground truncate">
              {loading && <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />}
              <span className="truncate">{currentUrl}</span>
            </div>
            <a href={currentUrl} target="_blank" rel="noreferrer">
              <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="w-3.5 h-3.5" /></Button>
            </a>
            <div className="flex items-center gap-1 ml-2 border-l pl-2">
              {step === "browse" && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleExtractLinks} disabled={loading}>
                  <List className="w-3.5 h-3.5 mr-1" /> Extrair Links
                </Button>
              )}
              {step === "fields" && (
                <>
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-300">
                    <Crosshair className="w-3 h-3 mr-1" /> Modo Seleção
                  </Badge>
                  <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleAutoDetectFields}>
                    <Wand2 className="w-3.5 h-3.5 mr-1" /> Auto-detetar
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStep("products")}>
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Voltar
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 flex min-h-0">
            {/* Iframe */}
            <div className="flex-1 relative">
              <iframe ref={iframeRef} srcDoc={htmlContent} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" title="Preview" />
              {step === "fields" && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-2 pointer-events-none">
                  <MousePointerClick className="w-3.5 h-3.5" /> Clique nos elementos que deseja extrair
                </div>
              )}
            </div>

            {/* Fields panel */}
            {step === "fields" && (
              <div className="w-80 border-l flex flex-col bg-background flex-shrink-0">
                <div className="p-3 border-b flex items-center justify-between">
                  <span className="text-sm font-semibold">Campos ({fields.length})</span>
                  <Button size="sm" className="h-7 text-xs" onClick={() => { if (fields.length === 0) { toast.error("Selecione pelo menos um campo."); return; } setStep("extract"); }}>
                    Extrair <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-2">
                    {fields.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-8 px-2">
                        Clique nos elementos da página para os adicionar como campos.
                      </p>
                    )}
                    {fields.map(f => (
                      <div key={f.id} className="border rounded-lg p-2 space-y-1">
                        <div className="flex items-center gap-1">
                          <Input value={f.name} onChange={e => setFields(prev => prev.map(ff => ff.id === f.id ? { ...ff, name: e.target.value } : ff))} className="h-6 text-xs font-medium" />
                          <Select value={f.type} onValueChange={v => setFields(prev => prev.map(ff => ff.id === f.id ? { ...ff, type: v as any } : ff))}>
                            <SelectTrigger className="h-6 w-16 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Texto</SelectItem>
                              <SelectItem value="image">Img</SelectItem>
                              <SelectItem value="link">Link</SelectItem>
                              <SelectItem value="html">HTML</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFields(prev => prev.filter(ff => ff.id !== f.id))}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{typeIcons[f.type]} {f.preview || "(vazio)"}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-mono text-muted-foreground/40 truncate flex-1">{f.selector}</p>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <Checkbox checked={f.isVariation} onCheckedChange={() => setFields(prev => prev.map(ff => ff.id === f.id ? { ...ff, isVariation: !ff.isVariation } : ff))} className="h-3 w-3" />
                            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><Layers className="w-2.5 h-2.5" /> Variação</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-2 border-t">
                  <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setFields(prev => [...prev, { id: crypto.randomUUID(), name: `Campo ${prev.length + 1}`, selector: "", type: "text", preview: "", isVariation: false }])}>
                    <Plus className="w-3 h-3 mr-1" /> Adicionar Campo Manual
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ STEP: Categories (layered) ═══ */}
      {step === "categories" && (
        <div className="flex-1 flex flex-col min-h-0 p-4 gap-3">
          {/* Header */}
          <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => {
              if (layers.length > 1) {
                const prev = layers.slice(0, -1);
                setLayers(prev);
                setCurrentLinks(prev[prev.length - 1].links);
              } else { setStep("browse"); }
            }}>
              <ArrowLeft className="w-3 h-3 mr-1" /> {layers.length > 1 ? "Nível Anterior" : "Voltar"}
            </Button>
            <h2 className="font-semibold text-sm">Estrutura do Site</h2>
            <Badge>{currentLinks.length} links</Badge>
            <Badge variant="outline" className="text-[10px]">{categoryLinks.length} categorias · {productLinksInView.length} produtos</Badge>
          </div>

          {/* Layer breadcrumbs */}
          {layers.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap text-xs text-muted-foreground border rounded-lg p-2 bg-muted/20 flex-shrink-0">
              <Layers className="w-3.5 h-3.5 mr-1" />
              {layers.map((layer, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  {idx > 0 && <ChevronRight className="w-3 h-3" />}
                  <button
                    className={`hover:underline ${idx === layers.length - 1 ? "font-semibold text-foreground" : ""}`}
                    onClick={() => {
                      if (idx < layers.length - 1) {
                        const sliced = layers.slice(0, idx + 1);
                        setLayers(sliced);
                        setCurrentLinks(sliced[sliced.length - 1].links);
                      }
                    }}
                  >
                    {layer.label.length > 50 ? layer.label.substring(0, 50) + "…" : layer.label}
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Actions panel */}
          <div className="flex flex-col gap-2 p-3 border rounded-lg bg-muted/30 flex-shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Ações</span>
              <div className="ml-auto flex gap-2 flex-wrap">
                {/* Classify selected */}
                <Button variant="outline" size="sm" onClick={() => setCurrentLinks(prev => prev.map(l => l.selected ? { ...l, linkType: "categoria" } : l))}>
                  Seleção → Categoria
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentLinks(prev => prev.map(l => l.selected ? { ...l, linkType: "produto" } : l))}>
                  Seleção → Produto
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
              {/* Drill into selected categories */}
              {selectedCats.length > 0 && (
                <Button size="sm" onClick={() => handleDrillInto(selectedCats.map(l => l.url))} disabled={loading}>
                  {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Layers className="w-3 h-3 mr-1" />}
                  Entrar em {selectedCats.length} categorias (próximo nível)
                </Button>
              )}

              {/* Pagination */}
              {currentLayer?.hasPagination && (
                <Button size="sm" variant="outline" onClick={handleFollowPagination} disabled={loading}>
                  {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                  ✓ Paginação ({currentLayer.paginationUrls.length} pág.)
                </Button>
              )}

              {/* Auto-collect products */}
              <Button size="sm" variant="secondary" onClick={handleAutoCollect} disabled={loading}>
                {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                Auto-recolher produtos
              </Button>

              {/* Manual collect */}
              {productLinksInView.length > 0 && (
                <Button size="sm" onClick={handleCollectProducts}>
                  <Target className="w-3 h-3 mr-1" /> Recolher {productLinksInView.filter(l => l.selected).length} produtos →
                </Button>
              )}
            </div>

            {collectProgress && (
              <div className="pt-2">
                <Progress value={(collectProgress.current / collectProgress.total) * 100} className="h-2" />
                <p className="text-[10px] text-muted-foreground mt-1">{collectProgress.current}/{collectProgress.total} categorias processadas</p>
              </div>
            )}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Input placeholder="Filtrar links..." value={linkFilter} onChange={e => setLinkFilter(e.target.value)} className="max-w-md" />
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentLinks(prev => prev.map(l => ({ ...l, selected: true })))}>Selecionar Todos</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentLinks(prev => prev.map(l => ({ ...l, selected: false })))}>Limpar</Button>
            </div>
          </div>

          {/* Links table */}
          <ScrollArea className="flex-1 border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredLinks.length > 0 && filteredLinks.every(l => l.selected)}
                      onCheckedChange={(c) => {
                        const urls = new Set(filteredLinks.map(l => l.url));
                        setCurrentLinks(prev => prev.map(l => urls.has(l.url) ? { ...l, selected: !!c } : l));
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-xs w-28">Tipo</TableHead>
                  <TableHead className="text-xs">URL</TableHead>
                  <TableHead className="text-xs">Texto</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLinks.map(link => (
                  <TableRow key={link.url} className={link.selected ? "bg-primary/5" : ""}>
                    <TableCell><Checkbox checked={link.selected} onCheckedChange={() => toggleLink(link.url)} /></TableCell>
                    <TableCell>
                      <Select value={link.linkType} onValueChange={v => changeLinkType(link.url, v as LinkType)}>
                        <SelectTrigger className="h-6 text-[10px] w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="categoria">Categoria</SelectItem>
                          <SelectItem value="grupo">Grupo</SelectItem>
                          <SelectItem value="produto">Produto</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs font-mono truncate max-w-md" title={link.url}>{link.url}</TableCell>
                    <TableCell className="text-xs truncate max-w-48">{link.text || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentLinks(prev => prev.filter(l => l.url !== link.url))}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      {/* ═══ STEP: Products collected ═══ */}
      {step === "products" && (
        <div className="flex-1 flex flex-col min-h-0 p-4 gap-3">
          <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => setStep("categories")}>
              <ArrowLeft className="w-3 h-3 mr-1" /> Voltar às Categorias
            </Button>
            <h2 className="font-semibold text-sm">URLs de Produto Recolhidas</h2>
            <Badge>{productUrls.length} produtos</Badge>
            <div className="ml-auto flex gap-2">
              <Button size="sm" onClick={() => handleOpenProductForFields()}>
                <Crosshair className="w-3 h-3 mr-1" /> Selecionar Campos num Produto
              </Button>
              {fields.length > 0 && (
                <Button size="sm" variant="default" onClick={handleRunExtraction}>
                  <Play className="w-3 h-3 mr-1" /> Extrair Todos ({productUrls.length} × {fields.length} campos)
                </Button>
              )}
            </div>
          </div>

          {fields.length > 0 && (
            <div className="p-3 border-2 border-primary/30 rounded-lg bg-primary/5 flex-shrink-0">
              <p className="text-sm font-medium mb-2">Campos definidos ({fields.length}):</p>
              <div className="flex flex-wrap gap-1">
                {fields.map(f => (
                  <Badge key={f.id} variant="secondary" className="text-xs">
                    {typeIcons[f.type]} {f.name}
                    {f.isVariation && <Layers className="w-2.5 h-2.5 ml-1 text-amber-500" />}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {fields.length === 0 && (
            <div className="p-3 border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/20 flex-shrink-0">
              <p className="text-sm text-muted-foreground">
                <AlertTriangle className="w-4 h-4 inline mr-1 text-amber-500" />
                Ainda não definiu campos. Abra um produto para selecionar visualmente os campos a extrair.
              </p>
            </div>
          )}

          <ScrollArea className="flex-1 border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead className="text-xs">URL do Produto</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productUrls.map((pUrl, idx) => (
                  <TableRow key={pUrl}>
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="text-xs font-mono truncate max-w-lg" title={pUrl}>{pUrl}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenProductForFields(pUrl)} title="Selecionar campos">
                          <Crosshair className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeProductUrl(pUrl)}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      {/* ═══ STEP: Extracting ═══ */}
      {step === "extract" && batchLoading && (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center p-8 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="font-semibold">A extrair dados...</p>
            {collectProgress && (
              <>
                <Progress value={(collectProgress.current / collectProgress.total) * 100} className="h-2" />
                <p className="text-sm text-muted-foreground">{collectProgress.current}/{collectProgress.total} páginas</p>
              </>
            )}
          </Card>
        </div>
      )}

      {/* ═══ STEP: Results ═══ */}
      {step === "results" && (
        <div className="flex-1 flex flex-col min-h-0 gap-3 p-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge>{results.length} produtos extraídos</Badge>
            {errors.length > 0 && <Badge variant="destructive">{errors.length} erros</Badge>}
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep("products")}>← Voltar</Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel}><Download className="w-3 h-3 mr-1" /> Excel</Button>
              <Button size="sm" onClick={() => setShowSendDialog(true)}><ArrowRight className="w-3 h-3 mr-1" /> Enviar p/ Ingestão</Button>
            </div>
          </div>

          <ScrollArea className="flex-1 border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  {results[0] && Object.keys(results[0]).map(key => (
                    <TableHead key={key} className="text-xs">{key}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    {Object.values(row).map((val, ci) => (
                      <TableCell key={ci} className="text-xs max-w-48 truncate" title={val}>
                        {val?.startsWith("http") ? <a href={val} target="_blank" rel="noreferrer" className="text-primary underline">{val.substring(0, 40)}...</a> : (val?.substring(0, 100) || "—")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Send to ingestion dialog */}
          <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Mapear Campos → Produto</DialogTitle>
                <DialogDescription>Associe cada campo ao campo correspondente do produto.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {results[0] && Object.keys(results[0]).map(scraperKey => (
                  <div key={scraperKey} className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
                    <div><p className="text-xs font-medium">{scraperKey}</p><p className="text-[10px] text-muted-foreground truncate">{results[0][scraperKey]?.substring(0, 80)}</p></div>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <Select value={scraperMapping[scraperKey] || "__ignore__"} onValueChange={v => setScraperMapping(prev => { const n = { ...prev }; if (v === "__ignore__") delete n[scraperKey]; else n[scraperKey] = v; return n; })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Ignorar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__ignore__"><span className="text-muted-foreground">— Ignorar —</span></SelectItem>
                        {DEFAULT_PRODUCT_FIELDS.map(pf => (<SelectItem key={pf.key} value={pf.key}>{pf.label}{pf.required ? " *" : ""}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setShowSendDialog(false)}>Cancelar</Button>
                <Button onClick={handleSendToProducts} disabled={batchLoading || !Object.values(scraperMapping).includes("title")}>
                  {batchLoading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                  Criar Job ({results.length} itens)
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}

/* ── Bot Icon ── */
function BotIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
    </svg>
  );
}
