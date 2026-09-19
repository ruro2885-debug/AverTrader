import fs from 'fs';
import path from 'path';

/**
 * Extract canonical base URL directly from index.html to guarantee 100% canonical alignment
 */
function getCanonicalBaseDomain() {
  try {
    const htmlPath = path.resolve(process.cwd(), 'index.html');
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, 'utf8');
      const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
      if (canonicalMatch && canonicalMatch[1]) {
        const url = new URL(canonicalMatch[1]);
        return `${url.protocol}//${url.host}`;
      }
    }
  } catch (err) {
    // Fallback to default custom domain
  }
  return 'https://www.avertrader.space';
}

const BASE_URL = getCanonicalBaseDomain();
const TODAY = new Date().toISOString().split('T')[0];

/**
 * Manifest of all publicly indexable routes
 * Internal/authenticated routes (/admin, /dashboard) are excluded to match robots.txt
 */
const PUBLIC_ROUTE_MANIFEST = [
  {
    path: '/',
    changefreq: 'daily',
    priority: '1.0',
    description: 'AverTrader Home & Platform Overview',
  },
  {
    path: '/market-highlights',
    changefreq: 'daily',
    priority: '0.9',
    description: 'Live Market Telemetry & Crypto Asset Highlights',
  },
  {
    path: '/showcase',
    changefreq: 'weekly',
    priority: '0.8',
    description: 'Trading Terminal Features & Platform Showcase',
  },
  {
    path: '/bonus-center',
    changefreq: 'weekly',
    priority: '0.8',
    description: 'Bonus Hub & Trader Incentive Rewards',
  },
  {
    path: '/events-promos',
    changefreq: 'weekly',
    priority: '0.8',
    description: 'Active Platform Events, Campaigns & Competitions',
  },
  {
    path: '/referral-centre',
    changefreq: 'weekly',
    priority: '0.7',
    description: 'Affiliate & Referral Partner Network',
  },
  {
    path: '/auth',
    changefreq: 'monthly',
    priority: '0.6',
    description: 'Secure Account Access & Verification',
  },
];

export function generateSitemapXml() {
  const urlEntries = PUBLIC_ROUTE_MANIFEST.map(route => {
    const loc = route.path === '/' ? `${BASE_URL}/` : `${BASE_URL}${route.path}`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
}

export function writeSitemap() {
  const sitemapXml = generateSitemapXml();

  const publicDir = path.resolve(process.cwd(), 'public');
  const distDir = path.resolve(process.cwd(), 'dist');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const publicSitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(publicSitemapPath, sitemapXml, 'utf8');
  console.log(`🗺️  [Sitemap Generator] Generated ${publicSitemapPath} (${PUBLIC_ROUTE_MANIFEST.length} indexed URLs)`);

  if (fs.existsSync(distDir)) {
    const distSitemapPath = path.join(distDir, 'sitemap.xml');
    fs.writeFileSync(distSitemapPath, sitemapXml, 'utf8');
    console.log(`🗺️  [Sitemap Generator] Synchronized ${distSitemapPath}`);
  }

  console.log(`✅ [Sitemap Generator] Base domain: ${BASE_URL}`);
  PUBLIC_ROUTE_MANIFEST.forEach(r => {
    const loc = r.path === '/' ? `${BASE_URL}/` : `${BASE_URL}${r.path}`;
    console.log(`   ✓ ${loc} (Priority: ${r.priority}, ${r.changefreq})`);
  });
}

writeSitemap();
