# Creamice: Design System

Source: `docs/reference/Creamice_Brand_Guidelines.pdf` (colours and fonts below are taken from it exactly). Anything marked "derived" is a supporting value added for usability and is not in the brand guide.

## 1. Direction

Simple, dark, confident. Think of a clean marketplace layout (Jumia-style: search up top, clear categories, dense and readable product grids, obvious prices and buttons) in Creamice black and gold.

Do:
- Plain layouts, generous spacing, strong type, real product photos.
- Gold only on the thing that matters most in a view (the main button, a selected state, a key link).
- Borders and spacing to separate things.

Do not:
- No emojis anywhere (UI, copy, alt text, placeholders).
- No gradients. No glows, no blurs, no glassmorphism, no drop shadows on cards.
- No decorative gold lines, flourishes or ornamental dividers.
- No stock-template look: no oversized rounded cards, no purple, no random illustration.
- No auto-playing carousels, marquees, parallax or scroll effects.

## 2. Colour

### Brand colours (from the guide)
| Name | Hex | Role |
| --- | --- | --- |
| Jet Black | `#0B0B0B` | Dominant background across the site |
| Metallic Gold | `#C6A15B` | Accents, primary buttons, highlights, selected states |
| Off-White | `#F5F2EB` | Main text on dark, light sections, product image backdrops |
| Charcoal Grey | `#292929` | Raised surfaces, inputs, hover backgrounds |

### Derived tokens
| Name | Hex | Use |
| --- | --- | --- |
| Surface | `#161616` | Cards and panels on Jet Black |
| Text muted | `#B3AEA3` | Secondary text on dark |
| Border | `#3A3A3A` | Dividers, card outlines |
| Border strong | `#6B665C` | Input outlines (needs to be clearly visible) |
| Gold hover | `#D4B375` | Primary button hover |
| Gold pressed | `#A98743` | Primary button pressed |
| Gold dark | `#7A5F26` | Gold-toned text on light backgrounds only |
| Text muted on light | `#5A564E` | Secondary text on Off-White |
| Error | `#E8786A` | Errors, cancelled |
| Success | `#6DBF8B` | Delivered, success messages |

### Checked contrast (WCAG ratios, computed)
| Pair | Ratio | Passes |
| --- | --- | --- |
| Off-White on Jet Black | 17.6 | AA, AAA |
| Off-White on Surface | 16.2 | AA, AAA |
| Off-White on Charcoal | 13.0 | AA, AAA |
| Text muted on Jet Black | 8.9 | AA, AAA |
| Text muted on Charcoal | 6.6 | AA |
| Gold on Jet Black | 8.1 | AA, AAA |
| Gold on Charcoal | 6.0 | AA |
| Jet Black text on Gold (buttons) | 8.1 | AA, AAA |
| Jet Black text on Gold hover | 9.9 | AA, AAA |
| Text muted on light on Off-White | 6.5 | AA |
| Gold dark on Off-White | 5.4 | AA |
| Error on Jet Black | 6.9 | AA |
| Success on Jet Black | 8.9 | AA |
| **Gold on Off-White** | **2.2** | **Fails. Never put gold text or icons on a light background.** |
| Border `#3A3A3A` on Jet Black | 1.7 | Decorative only. Inputs use Border strong (3.2). |

### Tokens in code (`src/styles/globals.css`)
```css
:root {
  --color-jet: #0B0B0B;
  --color-gold: #C6A15B;
  --color-offwhite: #F5F2EB;
  --color-charcoal: #292929;

  --color-surface: #161616;
  --color-text: #F5F2EB;
  --color-text-muted: #B3AEA3;
  --color-border: #3A3A3A;
  --color-border-strong: #6B665C;
  --color-gold-hover: #D4B375;
  --color-gold-pressed: #A98743;
  --color-gold-dark: #7A5F26;
  --color-text-muted-light: #5A564E;
  --color-error: #E8786A;
  --color-success: #6DBF8B;

  --radius: 4px;
  --ease: cubic-bezier(0.2, 0, 0, 1);
  --dur-fast: 150ms;
  --dur-base: 200ms;
}
```
Map these in the Tailwind theme (`bg-jet`, `text-offwhite`, `bg-gold`, and so on). Do not use raw hex values in components.

## 3. Typography

| Use | Font | Weight | Notes |
| --- | --- | --- | --- |
| Headings, hero, product titles, promotional text | Oswald | 500 or 600 | Uppercase for H1 and H2, letter-spacing 0.02em. Product titles in normal case. |
| Body, navigation, buttons, forms, descriptions, prices | Montserrat | 400, 500, 600 | Prices 600 with tabular numbers. |

Load both with `next/font/google`, subset `latin`, `display: swap`. Do not load other weights.

| Style | Mobile | Desktop |
| --- | --- | --- |
| Display (hero) | 36/40 | 56/60 |
| H1 | 30/36 | 40/44 |
| H2 | 24/28 | 30/36 |
| H3 | 20/24 | 22/28 |
| Body | 16/26 | 16/26 |
| Small | 14/22 | 14/22 |
| Label (buttons, tags) | 14, weight 600, uppercase, letter-spacing 0.04em | same |

Minimum text size is 14 px, except tiny tags at 12 px that never carry essential information. Maximum line length for reading text is about 70 characters.

Naira: format with `Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })`. Check that the naira sign (₦) renders in both fonts on a real Android phone; if it falls back to a different font and looks wrong, show "NGN 25,000" instead.

## 4. Layout

- Mobile first. Breakpoints: `sm` 640, `md` 768, `lg` 1024, `xl` 1280.
- Container: max width 1200 px, side padding 16 px (mobile), 24 px (md), 32 px (lg).
- Spacing scale (4 px base): 4, 8, 12, 16, 24, 32, 48, 64, 96. Section spacing 48 px mobile, 80 px desktop.
- Product grid: 2 columns (mobile), 3 (md), 4 (lg). Gap 12 px mobile, 24 px desktop.
- Product images: 4:5 ratio, `object-fit: cover`, on an Off-White or Charcoal backdrop; one backdrop style across the whole catalogue.
- Radius: 4 px everywhere. Badges 2 px. No pills.
- Elevation: none. Use borders. Overlays (drawer, sheet, modal) use a Jet Black scrim at 60 percent.
- Sections alternate between Jet Black and Surface. Use an Off-White section at most once or twice per page for contrast (for example the trust row).

## 5. Components

### Buttons
| Variant | Look | Use |
| --- | --- | --- |
| Primary | Gold fill, Jet Black text. Hover Gold hover. Pressed Gold pressed. | One per view area: Add to cart, Pay, Shop now |
| Secondary | Transparent, 1 px Off-White border, Off-White text. Hover Charcoal fill. | Second actions |
| Ghost | No border, Off-White text, underline on hover | Links and low-priority actions |
| Danger | Transparent, Error border and text | Cancel order, delete |

Height 48 px (44 px in dense dashboard tables), horizontal padding 24 px, full width on mobile forms. Disabled: 40 percent opacity and `not-allowed`. Loading: label changes to "Please wait" and the button is disabled; no spinners that spin forever.

### Form fields
Height 48 px, Charcoal background, 1 px Border strong, 4 px radius. Label above the field, always visible (no placeholder-only labels). Focus: 2 px Gold outline with 2 px offset. Error: Error-coloured border plus message text below ("Enter a valid phone number"). Use proper `type`, `inputmode` and `autocomplete`.

### Size chips
44 x 44 px minimum, 1 px Border strong, Off-White text. Selected: Gold fill, Jet Black text. Sold out: 40 percent opacity, diagonal strike line, not selectable, labelled for screen readers as "sold out".

### Product card
Image (4:5), name (Oswald, 2 lines max), price (Montserrat 600), compare-at price struck through in muted text, "Sold out" or "New" label top-left of the image (Charcoal fill, Off-White text). Whole card is one link. Hover: image scales to 1.03 over 200 ms. No quick-view, no hover buttons.

### Header
Jet Black, 1 px bottom border. Mobile: menu button, centred logo, search icon, cart icon with count. Desktop: logo, wide search field, cart; category links in a second row. Cart count uses a Gold badge with Jet Black text.

### Drawer and bottom sheet
Drawer (menu, cart) slides in from the side in 200 ms. Filter sheet slides up from the bottom on mobile. Close on scrim click and Escape; trap focus inside; restore focus on close.

### Badges and order status
Always text, never colour alone.
| Status | Style |
| --- | --- |
| Pending payment | Muted outline |
| Paid | Gold outline |
| Confirmed | Gold fill, Jet Black text |
| Processing | Off-White outline |
| Shipped | Off-White fill, Jet Black text |
| Delivered | Success outline |
| Cancelled | Error outline |

### Tables (dashboards)
Desktop: normal table with sticky header, 44 px rows. Below 768 px: each row becomes a stacked card (label and value pairs), never a horizontally scrolling table.

### Toasts and messages
Bottom of screen on mobile, bottom-right on desktop. Plain text, auto-dismiss after 5 seconds, errors stay until closed. No emojis.

### Icons
`lucide-react`, 1.5 px stroke, 20 px (24 px for header actions). Icons accompany text; icon-only buttons need an accessible name.

## 6. Motion

Purpose: confirm an action or soften a change. Nothing else.

Allowed:
- Colour, border and background transitions on hover and focus: 150 ms.
- Drawer, sheet and modal open and close: 200 ms, ease-out.
- Content fade-in of 200 ms on route change (opacity only).
- Product image scale 1.03 on card hover (desktop only).
- Skeleton placeholders (a static dark block, with at most a slow 1.5 s opacity pulse) while data loads.

Not allowed: parallax, scroll-jacking, scroll-triggered reveal on every block, auto-advancing carousels, marquees, bouncing, spinning, animated counters, cursor effects, page-load intros, anything over 250 ms.

Always honour the user's setting:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}
```

## 7. Logo

Files in `public/brand/`. The mark is a gold crescent C with a silver I and a crown, with the wordmark CREAMICE in gold and silver. It already contains silver and metallic texture that is not part of the colour palette; use the logo only as supplied and never recolour it.

- On Jet Black, use `logo-black-bg.jpeg` until a transparent version exists. Its background is near black but not exactly `#0B0B0B`, so place it in a container with a background of pure black or ask the designer for a transparent PNG or SVG (preferred; requested in the PRD).
- Minimum height in the header: 40 px (mark only) or 28 px if the wordmark alone is used. Clear space around the logo equals the height of the crown.
- Do not stretch, rotate, add effects or place it on busy photos.
- Use a small, optimised, transparent file for the header, and the large file only for Open Graph images and print.

## 8. Wireframes (structure only)

Home, mobile:
```
[menu]   CREAMICE LOGO   [search][cart 0]
------------------------------------------
[ hero image ]
NEW SEASON ESSENTIALS
[ SHOP NOW ]  (gold)
------------------------------------------
SHOP BY CATEGORY
[Hoodies][Joggers]
[Sweatshirts][Sweatpants]
------------------------------------------
NEW ARRIVALS             View all
[card][card]
[card][card]
------------------------------------------
Delivery across Nigeria | Secure payment | WhatsApp support
------------------------------------------
LATEST UPDATES (3 items)
------------------------------------------
footer links, WhatsApp Channel, Instagram
```

Product page, desktop:
```
Home / Hoodies / Black Hoodie
[ gallery with thumbnails ]    NAME (Oswald)
                               NGN 25,000
                               Size: [S][M][L][XL][XXL]
                               Quantity [-] 1 [+]
                               [ ADD TO CART ] (gold)
                               Delivery: Nigeria, 2 to 5 days (from settings)
                               Share on WhatsApp
Description | Delivery and returns
You may also like (4 cards)
```

Checkout, desktop:
```
Delivery details               | Order summary
Full name [        ]           | thumb  Name  size  qty   price
Email     [        ]           | Discount code [      ] [Apply]
Phone     [        ]           | Subtotal
Address   [        ]           | Delivery (by state)
City [    ]  State [select v]  | Total
Note      [        ]           | [ PAY WITH FLUTTERWAVE ]
                               | Secure payment by Flutterwave
```
On mobile the summary sits above the form, collapsed to one line "Order total, show details".

Partner orders, mobile (no money fields):
```
Orders   [Status: Paid v]  [search]
-----------------------------------
CRM-1042        PAID
Ada Obi, Lagos
2 items
[ View ]   [ Approve ]
-----------------------------------
```

## 9. Imagery and tone of writing

- Photos: one consistent backdrop, front and back views, a detail shot, natural light, sized as in the technical doc. Minimum 1200 px on the long side before compression.
- Copy: short, direct, confident. Sentence case for body, uppercase only through the heading style. No exclamation marks in a row, no slang that excludes people, no emojis.
- Error and empty messages explain what happened and what to do next.
