# Design System: Fintab SePay Operations Cockpit

## 1. Visual Theme & Atmosphere
Fintab x SePay is a compact invoice operations cockpit for accounting and POS teams. The product should feel warm, precise, and operational: a premium back-office console for controlling invoice risk, queue reliability, tax mapping, and SePay issue readiness.

- **Density:** Cockpit Dense, 7/10. Data-heavy screens stay compact; only exceptions and decisions get breathing room.
- **Variance:** Offset Asymmetric, 5/10. Use operation strips, split panels, and detail rails instead of generic centered cards.
- **Motion:** Static Restrained, 4/10. Interaction should feel tactile and useful, never cinematic or decorative.

## 2. Color Palette & Roles
- **Canvas Sand** (#F4F0E8) — Main app background, warm but quiet.
- **Surface Bone** (#FFFCF5) — Main panels, tables, forms.
- **Surface Muted** (#F7F2EA) — Filter bars, table headers, inactive strips.
- **Charcoal Ink** (#18181B) — Primary text and high-emphasis controls. Never use pure black.
- **Muted Zinc** (#71717A) — Secondary labels, timestamps, helper text.
- **Warm Line** (#E6DED2) — Structural 1px borders and table dividers.
- **Deep Emerald** (#1F6F5B) — The only accent color. Use for primary actions, active shop, success state, and focus rings.
- **Amber Signal** (#B45309) — Payment warning, pending, requires attention.
- **Red Ledger** (#B42318) — Failed job, blocked invoice, destructive states.

## 3. Typography Rules
- **Display:** Geist Sans — tight tracking, strong weight, controlled scale. Use hierarchy through weight, spacing, and color rather than oversized text.
- **Body:** Geist Sans — relaxed leading, maximum readable copy width of 65 characters.
- **Mono:** Geist Mono — invoice IDs, order IDs, timestamps, amounts, counters, and dense operational numbers.
- **Scale:** Auth/landing titles may be large. Authenticated app page titles stay compact, 1.75rem to 2.25rem. Section titles use 1rem to 1.25rem with tight tracking.
- **Banned:** Inter, generic system-only presentation, and all serif fonts in dashboard or software UI screens.

## 4. Component Stylings
* **Buttons:** Flat, rounded controls with one primary teal fill. Secondary buttons use porcelain fill and sand border. Active state moves down 1px or scales to 0.98. No glow, no neon, no custom cursor.
* **Cards/Panels:** Use panels only for summaries, filters, and detail rails. Avoid stacking many large rounded cards. Radius is 1.25rem to 1.5rem in app screens.
* **Inputs:** Label above input, helper below, error below helper. Porcelain fill, sand border, Deep Teal focus ring. No floating labels.
* **Badges:** Compact rounded rectangles, not oversized pills. Raw backend enum labels must never be shown alone; translate into Vietnamese operational language.
* **Tables:** Row height 56–64px, sticky-feeling headers, clear dividers. Numeric cells use mono or tabular figures. Repeated actions must be muted unless the row needs attention.
* **Loaders:** Skeleton blocks matching final layout dimensions. No generic circular spinners.
* **Empty States:** Composed states with direct instruction and one action. Never show only “No data”.
* **Error States:** Clear inline message. Explain what failed and what the user can do next.

## 5. Layout Principles
- Use CSS Grid for major layout structures. Avoid flexbox percentage math and `calc()` hacks.
- Data pages follow this order: compact page header, metrics strip, command bar, main table, optional detail panel.
- Contain page content at approximately 1400px maximum width on large screens.
- Hero and login screens must be split or asymmetric. Centered hero sections are banned.
- The generic 3 equal card feature row is banned. Use pipeline rows, asymmetric columns, split panels, or horizontal operational flows.
- Full-height sections use `min-height: 100dvh`, never `h-screen`.
- Below 768px, all multi-column layouts collapse to a single column with no horizontal scroll.
- Touch targets must be at least 44px high.

## 6. Motion & Interaction
- Use spring-like timing for important transitions: quick entry, soft settle, no linear feel.
- Animate only `transform` and `opacity` for interactive elements.
- Use subtle stagger when rendering visual lists or dashboard modules.
- Active operational elements may use restrained micro-motion: pulse, shimmer, or gentle float. Never loop large layout movement.
- Respect performance: keep animation CSS-only unless a screen already needs client-side state.

## 7. Anti-Patterns (Banned)
- No emojis anywhere.
- No Inter font.
- No pure black (#000000).
- No neon glows, purple glows, or blue/purple AI gradients.
- No oversaturated accents and no second accent color.
- No excessive gradient text on large headers.
- No custom mouse cursors.
- No overlapping text or stacked absolute-positioned content.
- No centered hero sections for this project.
- No 3-column equal feature card rows.
- No generic names such as John Doe, Acme, or Nexus.
- No fake round metrics such as 99.99% or 50%.
- No AI copywriting clichés: Elevate, Seamless, Unleash, Next-Gen, Game-changer.
- No filler UI text such as Scroll to explore, Swipe down, or bouncing arrows.
- No broken Unsplash links. Use product-native UI panels or `picsum.photos` only when imagery is required.
- No raw enum labels without business translation.
- No repeated primary action buttons that ignore row state.
- No oversized empty rounded cards on operational screens.
