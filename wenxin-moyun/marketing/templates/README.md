# VULCA Marketing Templates

Brand material HTML templates for VULCA's open-source launch campaign. Each file is self-contained and can be opened directly in any browser.

## Files

| File | Dimensions | Purpose |
|------|-----------|---------|
| `styles.css` | — | Shared CSS variables, utilities, brand tokens |
| `twitter-card.html` | 1200 x 675 px | X/Twitter post images |
| `video-cover.html` | 1920 x 1080 px | YouTube/video thumbnails with play button |
| `linkedin-post.html` | 1200 x 627 px | LinkedIn post images (two-column layout) |
| `og-card.html` | 1200 x 630 px | Open Graph / social sharing cards |

## Quick Start

```bash
# Open any template in your browser
open twitter-card.html
# or
xdg-open twitter-card.html   # Linux
start twitter-card.html       # Windows
```

All 6 content variants render on a single page. Scroll to find the one you need.

## Content Variants

Each template includes multiple messaging variants:

| Variant | Theme | Headline | Best For |
|---------|-------|----------|----------|
| v1 | Provocation | "Your AI Passed the Benchmark. It Failed the Culture." | Launch announcements, attention-grabbing posts |
| v2 | Multi-dimensional | "One Score Tells You Nothing" | Technical audience, research community |
| v3 | Product Demo | "No-Code Cultural Audit in 60 Seconds" | Product demos, walkthroughs |
| v4 | Cultural Tension | "8 Cultural Perspectives. One Model. Zero Consensus." | Cultural commentary, thought leadership |
| v5 | Research | "Self-Evolving Evaluation" | Academic audience, paper announcements |
| v6 | Developer Launch | "pip install vulca" | Developer community, open-source launch |

## Capturing as Images

### Option 1: Browser Screenshot (Recommended)

1. Open the HTML file in Chrome/Edge
2. Open DevTools (F12)
3. Click the device toolbar icon (or Ctrl+Shift+M)
4. Set custom dimensions:
   - Twitter: 1200 x 675
   - Video: 1920 x 1080
   - LinkedIn: 1200 x 627
   - OG: 1200 x 630
5. Set device pixel ratio to 2 (for Retina)
6. Right-click the card element > "Capture node screenshot"

### Option 2: Playwright Script

```bash
npx playwright screenshot --viewport-size="1200,675" twitter-card.html twitter-v1.png
```

### Option 3: Chrome CLI

```bash
google-chrome --headless --screenshot=twitter-v1.png \
  --window-size=1200,675 \
  --default-background-color=0 \
  twitter-card.html
```

### Option 4: html2canvas / Puppeteer

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 675, deviceScaleFactor: 2 });
  await page.goto('file:///path/to/twitter-card.html');

  // Capture each variant
  const cards = await page.$$('.twitter-card');
  for (let i = 0; i < cards.length; i++) {
    await cards[i].screenshot({ path: `twitter-v${i + 1}@2x.png` });
  }

  await browser.close();
})();
```

## Customizing

### Change a headline

Edit the `.headline` content inside the relevant `<div class="card-inner">` block. Each variant is clearly labeled with HTML comments.

### Switch between dark/light theme

Change the theme class on the card element:
- `theme-dark` / `theme-light` (Twitter, Video)
- `theme-pro-dark` / `theme-pro-light` (LinkedIn)
- `theme-clean-dark` / `theme-minimal-light` (OG)

### Update stats

Find the `.stat-number` and `.stat-text` spans within each variant and change the values.

## Brand Color Reference

| Token | Hex | Usage |
|-------|-----|-------|
| Ink Stone Gray | `#334155` | Primary text, dark backgrounds |
| Warm Copper Brown | `#B0683A` | Brand accent, CTAs |
| Copper Highlight | `#C87F4A` | Accent on dark backgrounds |
| Cream White | `#FAF7F2` | Light backgrounds |
| Dark Base | `#0F0D0B` | Dark backgrounds |
| Sage Green | `#5F8A50` | Success states, badges |
| Amber Yellow | `#B8923D` | Warning states |
| Coral Red | `#B35A50` | Error states |
| Brand Gradient | `135deg, #334155 → #C87F4A` | Hero backgrounds, text effects |

## Typography

- **Headings**: SF Pro Display / -apple-system / system-ui, Bold 700
- **Body**: SF Pro Text / -apple-system / system-ui, Regular 400
- **Code**: SF Mono / Fira Code / Cascadia Code, monospace

## Design Tokens

All design tokens are defined as CSS custom properties in `styles.css`. The HTML files link to this shared stylesheet but also include self-contained inline styles so each file works independently.

## Logo

The VULCA logo is an inline SVG "V" shape rendered in warm copper (`#C87F4A` on dark, `#B0683A` on light). It consists of:
- Outer V: `M4 6L18 30L32 6` (primary stroke)
- Inner V: `M11 18L18 30L25 18` (secondary, 40% opacity)

To customize the logo size, adjust the `width` and `height` on the `<svg>` element.

## No External Dependencies

All templates are fully self-contained with:
- No CDN links
- No external fonts (uses system font stack)
- No JavaScript required
- Inline SVG for all graphics
