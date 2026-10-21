# Creamice: Design Direction

Status: **current**. This replaces the earlier dark editorial direction. The brand
guidelines still supply the logo, the name and the black / gold / white palette;
they no longer dictate layout, typography scale or surface treatment.

## 1. Two themes, one brand

| Area | Theme | Why |
| --- | --- | --- |
| Storefront (`/`, `/shop`, `/product`, `/cart`, `/checkout`) | **Light** | People buy on familiar ground. A bright marketplace reads faster, photographs better and feels trustworthy. |
| Dashboard (`/dashboard`, `/login`) | **Dark** | The team works in it for hours. Dark surfaces reduce glare and make status colour and money figures stand out. |

The storefront is a **clean marketplace**: search first, dense but breathable
grids, obvious prices, one clear action per block. Think Jumia's clarity with
the restraint of a modern fashion retailer. It is not an editorial site, not a
lookbook, and not a clone of a template.

## 2. Colour

The palette is black, gold and white. Both themes share the same token names so
one component works in either theme; the values swap per scope.

### Storefront (light)

| Token | Value | Use |
| --- | --- | --- |
| `jet` (canvas) | `#FFFFFF` | Page background |
| `surface` | `#FFFFFF` | Cards, header, forms |
| `charcoal` (soft) | `#F6F3EC` | Image backdrops, quiet panels, hover rows |
| `offwhite` (ink) | `#121212` | Body text and headings |
| `muted` | `#6A6A6A` | Secondary text, meta, placeholders |
| `border` | `#E7E2D7` | Dividers and card outlines |
| `border-strong` | `#CFC8B9` | Form outlines |
| `gold` | `#C6A15B` | Primary buttons, badges, focus ring |
| `gold-ink` | `#7C5F27` | Gold *text* on light (accessible) |
| `error` / `success` | `#B42318` / `#067647` | Validation and status |

Rules:
- Gold is an accent, not a background wash. At most one gold-filled button per viewport.
- Never set gold `#C6A15B` as small text on white. Use `gold-ink` for text, `gold` for fills and borders.
- Prices are ink, not gold. A struck-through compare price is muted.
- Sale / New / Sold out badges are black, gold or soft-cream chips with dark text.

### Dashboard (dark)

| Token | Value | Use |
| --- | --- | --- |
| `jet` | `#0B0B0B` | Canvas |
| `surface` | `#141414` | Cards, sidebar, top bar |
| `charcoal` | `#1E1E1E` | Row hover, inputs, nested panels |
| `offwhite` | `#F5F2EB` | Text |
| `muted` | `#A7A199` | Secondary text |
| `border` | `#262626` | Dividers |
| `border-strong` | `#3A3A3A` | Form outlines |
| `gold` | `#C6A15B` | Active nav, primary action, focus |

### Footer
The storefront footer is the one large black block in the light theme. It closes
the page and carries the brand. Off-white text, gold only for the wordmark and
hover states.

## 3. Type

- **Oswald** — display only: the wordmark, hero headline, section titles, dashboard numbers. Uppercase, tight tracking. Never for body copy.
- **Montserrat** — everything else: navigation, product names, prices, buttons, forms, tables. Weights 400 / 500 / 600 / 700.
- Load through `next/font` only. No additional families.

Scale (desktop / mobile):
- Hero `clamp(2.25rem, 5vw, 4rem)` / line-height 1.02
- Section title 28 / 22 px, Oswald 600, uppercase
- Card title 15–16 px, Montserrat 500
- Body 15–16 px, line-height 1.6
- Meta and labels 12–13 px
- Dashboard metric 30–36 px Oswald 600, tabular numbers

## 4. Layout and surfaces

- Content width: `1240 px` maximum, `16 px` mobile gutters, `24 px` tablet, `32 px` desktop.
- Radii: `8 px` controls, `12 px` cards, `16 px` large panels. Pills only for chips and the search field.
- Borders do the separating. Shadows are subtle and only on hover or floating layers (`0 8px 24px rgb(0 0 0 / 0.08)` light, `0 8px 24px rgb(0 0 0 / 0.4)` dark).
- No gradients, glows, glassmorphism, marquees, parallax or auto-playing carousels.
- Sections alternate white and soft cream. The black promo band and footer are the only large dark blocks in the storefront.

## 5. Storefront components

### Header
1. **Utility strip** (`#0B0B0B`, 36 px): "Delivery across Nigeria · Secure payment by Flutterwave" left; "Track order" and "Help" right.
2. **Main bar** (white, 72–80 px): wordmark left; wide search in the middle with a black submit button; cart with count right. Mobile: menu, wordmark, search toggle, cart.
3. **Category bar** (white, 44 px, bottom border): "Shop all" then category links. Horizontal scroll on mobile, no wrapping.
4. Sticky on scroll. No hide-on-scroll animation.

### Product card
- 4:5 image on soft cream, object-cover when a photo exists, category glyph when it does not.
- Whole card is a link. Quick-add button is a separate control and must stop propagation.
- Name (2 lines max), category meta, price row with compare-at, badges top-left.
- Hover: lift shadow and image scale `1.03` on pointer devices only.

### Buttons
- Primary: gold fill `#C6A15B`, ink text `#14100A`, 8 px radius, 44–48 px tall.
- Secondary: ink fill `#121212`, white text (storefront) / surface fill with border (dashboard).
- Tertiary: text with underline on hover.
- Destructive: outline error, never a full red fill.

### Forms
- Label above, 14 px medium. Input 44–48 px, 8 px radius, 1 px `border-strong`, white background.
- Focus: 2 px gold ring with 2 px offset. Error text below in `error`, never colour-only.
- One column on mobile. Two columns only for short paired fields (city / state).

### Cart and checkout
- Cart line: 72–88 px thumbnail, name, size, quantity stepper, line total, remove.
- Summary panel sticks on desktop, sits below the form on mobile.
- Checkout is one page, form left, summary right. Show the delivery fee as soon as a state is chosen.
- Payment button states: idle, "Opening secure payment…", error. Never leave the customer guessing.

## 6. Dashboard components

- **Shell:** 256 px sidebar (`surface`), wordmark top, grouped nav (Store, Operations, Settings), active item gold text with a 12% gold tint and a 2 px gold left edge. Top bar with page context, "View store", user chip and sign out.
- **Mobile:** top bar with menu button; navigation opens in the existing `Drawer`. Tables become stacked cards.
- **Cards:** `surface`, 1 px `border`, 12 px radius, 20–24 px padding.
- **Metrics:** label above, number in Oswald, delta or context below. No sparkline until there is real data.
- **Tables:** 44 px rows, muted header, hover `charcoal`, money right-aligned and tabular, status chips. Empty state always explains the next action.
- **Status colours:** awaiting payment muted, paid gold, confirmed/processing blue-neutral, shipped ink, delivered success, cancelled/error red. Always pair colour with text.

## 7. Motion

- 150–200 ms, `cubic-bezier(0.2, 0, 0, 1)`.
- Hover: background, border and shadow only. Image scale `1.03` on pointer devices.
- Drawers slide 200 ms. Toasts fade and rise 8 px.
- Respect `prefers-reduced-motion`: remove transforms and animation durations.

## 8. Responsive

- Mobile first. No horizontal scroll at 320 px.
- Grids: 2 columns at 360 px, 3 at 768 px, 4 at 1024 px, 4–5 at 1280 px.
- Touch targets 44 px minimum. Sticky header on mobile, sticky summary on desktop checkout.
- Dashboard sidebar collapses below 1024 px. Filters collapse into a `<details>` panel below 768 px.

## 9. Accessibility

- Contrast: 4.5:1 for body text, 3:1 for large text and UI outlines.
- Visible focus on every control. Skip link to `#main`.
- Images need alt text; decorative placeholders are `aria-hidden`.
- Form errors are linked with `aria-describedby` and announced with `role="alert"`.
- Colour is never the only signal for status or errors.

## 10. Content rules

- No emojis anywhere.
- Do not invent prices, stock, policy text, delivery promises, ratings or review counts.
- Placeholder product imagery must say it is a placeholder; never fake a photo.
- Empty states say what will appear and what to do next.
- Currency is naira, formatted from integer kobo (`formatNaira`).

## 11. Implementation notes

- Tokens live in `src/app/globals.css`. `:root` is the light storefront; `.theme-admin` overrides for the dashboard. Components use the same utility names in both themes.
- `jet` means *canvas*, `offwhite` means *ink*, `charcoal` means *soft surface*. The names are historical; the values are what change.
- Do not hard-code hex values in components. Add a token instead.
