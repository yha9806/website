/**
 * Prerender script for VULCA marketing pages
 * Generates static HTML with proper meta tags for SEO
 */

import { renderToString } from 'react-dom/server';

// Page-specific SEO data
const pagesSEO: Record<string, { title: string; description: string; keywords: string }> = {
  '/': {
    title: 'VULCA - Cultural AI Evaluation Platform',
    description: '47-dimension evaluation across 8 cultural perspectives. Reproducible benchmarking for AI art and culture understanding.',
    keywords: 'AI evaluation, cultural AI, art evaluation, AI benchmark, VULCA',
  },
  '/product': {
    title: 'Product - VULCA Cultural AI Evaluation',
    description: 'Comprehensive 47D evaluation framework with 8 cultural perspectives. Benchmark library, evaluation engine, and explainable diagnostics.',
    keywords: 'AI product, evaluation framework, cultural benchmark, 47 dimensions',
  },
  '/pricing': {
    title: 'Pricing - VULCA AI Evaluation',
    description: 'Free tier, Pilot ($2,500), and Enterprise ($15,000+) plans. Start evaluating your AI models for cultural understanding today.',
    keywords: 'AI pricing, evaluation pricing, VULCA plans, enterprise AI',
  },
  '/demo': {
    title: 'Book a Demo - VULCA',
    description: 'Schedule a personalized demo to see how VULCA can help evaluate your AI models for cultural understanding.',
    keywords: 'AI demo, evaluation demo, book demo, VULCA demo',
  },
  '/trust': {
    title: 'Trust & Security - VULCA',
    description: 'Enterprise-grade security with AES-256 encryption, RBAC, audit logging, and GDPR compliance. Your data, your control.',
    keywords: 'AI security, data privacy, GDPR compliance, enterprise security',
  },
  '/data-ethics': {
    title: 'Data & Ethics - VULCA',
    description: 'Our commitment to ethical AI evaluation. Data processing policies, AI ethics framework, and model rights.',
    keywords: 'AI ethics, data ethics, responsible AI, model rights',
  },
  '/sop': {
    title: 'Standard Operating Procedures - VULCA',
    description: 'Our 5-step evaluation process. From benchmark selection to report generation in a clear, repeatable methodology.',
    keywords: 'AI SOP, evaluation process, pilot evaluation, enterprise SOP',
  },
  '/methodology': {
    title: 'Methodology - VULCA Evaluation Framework',
    description: 'L1-L5 cognitive framework, 6D to 47D dimension expansion, and 8 cultural perspectives methodology.',
    keywords: 'AI methodology, evaluation methodology, cognitive framework, cultural perspectives',
  },
  '/dataset': {
    title: 'Dataset - VULCA Benchmark',
    description: '130 artworks, 7,410+ annotations. Open benchmark dataset for AI cultural understanding evaluation.',
    keywords: 'AI dataset, benchmark dataset, art dataset, cultural dataset',
  },
  '/papers': {
    title: 'Papers - VULCA Research',
    description: 'EMNLP 2025, WiNLP 2025, and arXiv publications. Academic research on AI cultural evaluation.',
    keywords: 'AI papers, EMNLP, research papers, academic AI',
  },
  '/vulca': {
    title: 'VULCA Demo - Interactive AI Evaluation',
    description: 'Try the VULCA evaluation framework. Explore 47 dimensions across 8 cultural perspectives.',
    keywords: 'AI demo, interactive demo, VULCA demo, evaluation demo',
  },
  '/models': {
    title: 'AI Models Leaderboard - VULCA',
    description: '42+ AI models evaluated across 47 dimensions. Compare GPT, Claude, Gemini, and more.',
    keywords: 'AI leaderboard, model comparison, GPT, Claude, AI ranking',
  },
  '/solutions': {
    title: 'Solutions - VULCA',
    description: 'Solutions for AI Labs, Research Institutions, and Museums. Cultural AI evaluation for every team.',
    keywords: 'AI solutions, enterprise AI, research AI, museum AI',
  },
  '/solutions/ai-labs': {
    title: 'AI Labs Solution - VULCA',
    description: 'Pre-release cultural audits and 47D regression tracking for AI labs and companies.',
    keywords: 'AI labs, model selection, pre-release audit, AI company',
  },
  '/solutions/research': {
    title: 'Research Solution - VULCA',
    description: 'Citation-ready reports and version-controlled reproducibility for academic research.',
    keywords: 'AI research, academic AI, reproducible research, citation',
  },
  '/solutions/museums': {
    title: 'Museums Solution - VULCA',
    description: 'Multi-cultural validation and interpretive AI quality for museums and galleries.',
    keywords: 'museum AI, cultural AI, gallery AI, interpretive AI',
  },
  '/customers': {
    title: 'Customers - VULCA',
    description: 'Trusted by AI labs, researchers, and museums worldwide for cultural AI evaluation.',
    keywords: 'VULCA customers, AI customers, testimonials',
  },
  '/pilot': {
    title: 'Pilot Program - VULCA',
    description: 'Start your 2-week pilot evaluation. $2,500 for comprehensive AI cultural assessment.',
    keywords: 'AI pilot, pilot program, evaluation pilot',
  },
  '/exhibitions': {
    title: 'Exhibitions - VULCA',
    description: 'AI-powered art exhibitions and cultural dialogues. Explore the intersection of AI and art.',
    keywords: 'AI exhibitions, art exhibitions, cultural AI',
  },
};

// Simple component for prerendering
function PrerenderPage({ url }: { url: string }) {
  const seo = pagesSEO[url] || pagesSEO['/'];
  
  return (
    <div id="root">
      <noscript>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>{seo.title}</h1>
          <p>{seo.description}</p>
          <p>Please enable JavaScript to use the full VULCA platform.</p>
          <a href="https://vulcaart.art">Visit VULCA</a>
        </div>
      </noscript>
      <div className="prerender-placeholder" style={{ display: 'none' }}>
        {/* SEO content for crawlers */}
        <h1>{seo.title}</h1>
        <p>{seo.description}</p>
      </div>
    </div>
  );
}

// Prerender function called by vite-prerender-plugin
export async function prerender(data: { url: string }) {
  const url = data.url || '/';
  const seo = pagesSEO[url] || pagesSEO['/'];

  const html = renderToString(<PrerenderPage url={url} />);

  // Return all marketing routes to prerender
  const links = new Set(Object.keys(pagesSEO));

  return {
    html,
    links,
    head: {
      lang: 'en',
      title: seo.title,
      elements: new Set([
        { type: 'meta', props: { name: 'description', content: seo.description } },
        { type: 'meta', props: { name: 'keywords', content: seo.keywords } },
        { type: 'meta', props: { property: 'og:title', content: seo.title } },
        { type: 'meta', props: { property: 'og:description', content: seo.description } },
        { type: 'meta', props: { property: 'og:type', content: 'website' } },
        { type: 'meta', props: { property: 'og:url', content: `https://vulcaart.art${url}` } },
        { type: 'meta', props: { name: 'twitter:title', content: seo.title } },
        { type: 'meta', props: { name: 'twitter:description', content: seo.description } },
        { type: 'link', props: { rel: 'canonical', href: `https://vulcaart.art${url}` } },
      ]),
    },
  };
}
