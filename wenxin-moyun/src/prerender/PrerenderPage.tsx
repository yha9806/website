import React from 'react';

interface PrerenderSEO {
  title: string;
  description: string;
}

interface PrerenderPageProps {
  seo: PrerenderSEO;
}

export function PrerenderPage({ seo }: PrerenderPageProps) {
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
        <h1>{seo.title}</h1>
        <p>{seo.description}</p>
      </div>
    </div>
  );
}

