import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Styleguide | Creamice",
  description: "Design system reference",
};

const colors = [
  { name: "Jet Black", token: "jet", hex: "#0B0B0B", role: "Dominant background", text: "offwhite" },
  { name: "Metallic Gold", token: "gold", hex: "#C6A15B", role: "Accents, primary buttons", text: "jet" },
  { name: "Off-White", token: "offwhite", hex: "#F5F2EB", role: "Main text on dark", text: "jet" },
  { name: "Charcoal Grey", token: "charcoal", hex: "#292929", role: "Raised surfaces", text: "offwhite" },
  { name: "Surface", token: "surface", hex: "#161616", role: "Cards and panels", text: "offwhite" },
  { name: "Text Muted", token: "text-muted", hex: "#B3AEA3", role: "Secondary text on dark", text: "jet" },
  { name: "Border", token: "border", hex: "#3A3A3A", role: "Dividers, card outlines", text: "offwhite" },
  { name: "Border Strong", token: "border-strong", hex: "#6B665C", role: "Input outlines", text: "offwhite" },
  { name: "Gold Hover", token: "gold-hover", hex: "#D4B375", role: "Primary button hover", text: "jet" },
  { name: "Gold Pressed", token: "gold-pressed", hex: "#A98743", role: "Primary button pressed", text: "jet" },
  { name: "Gold Dark", token: "gold-dark", hex: "#7A5F26", role: "Gold text on light backgrounds", text: "offwhite" },
  { name: "Error", token: "error", hex: "#E8786A", role: "Errors, cancelled", text: "jet" },
  { name: "Success", token: "success", hex: "#6DBF8B", role: "Delivered, success", text: "jet" },
];

const typeScale = [
  { name: "Display (Hero)", mobile: "36/40", desktop: "56/60", weight: "500-600", font: "Oswald" },
  { name: "H1", mobile: "30/36", desktop: "40/44", weight: "600", font: "Oswald" },
  { name: "H2", mobile: "24/28", desktop: "30/36", weight: "600", font: "Oswald" },
  { name: "H3", mobile: "20/24", desktop: "22/28", weight: "600", font: "Oswald" },
  { name: "Body", mobile: "16/26", desktop: "16/26", weight: "400", font: "Montserrat" },
  { name: "Small", mobile: "14/22", desktop: "14/22", weight: "400", font: "Montserrat" },
  { name: "Label (Buttons)", mobile: "14/1", desktop: "14/1", weight: "600", font: "Montserrat" },
];

const buttons = [
  { variant: "Primary", className: "bg-gold text-jet hover:bg-gold-hover active:bg-gold-pressed", description: "One per view: Add to cart, Pay" },
  { variant: "Secondary", className: "border border-offwhite text-offwhite hover:bg-charcoal", description: "Second actions" },
  { variant: "Ghost", className: "text-offwhite underline-offset-2 hover:underline", description: "Links and low-priority" },
  { variant: "Danger", className: "border border-error text-error hover:bg-error/10", description: "Cancel, delete" },
];

const formExample = (
  <div className="space-y-4 max-w-md">
    <div>
      <label htmlFor="email" className="block text-sm font-medium mb-1 text-offwhite">
        Email
      </label>
      <input
        id="email"
        type="email"
        placeholder="you@example.com"
        className="w-full h-12 bg-charcoal border border-border-strong rounded-[4px] px-4 text-offwhite placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-jet"
      />
    </div>
    <div>
      <label htmlFor="password" className="block text-sm font-medium mb-1 text-offwhite">
        Password
      </label>
      <input
        id="password"
        type="password"
        placeholder="••••••••"
        className="w-full h-12 bg-charcoal border border-border-strong rounded-[4px] px-4 text-offwhite placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-jet"
      />
    </div>
    <div className="text-sm text-error">Enter a valid email address</div>
  </div>
);

export default function StyleguidePage() {
  return (
    <main className="min-h-screen bg-jet text-offwhite py-12 px-4 sm:px-8 lg:px-16">
      <div className="max-w-5xl mx-auto space-y-16">
        <header className="border-b border-border pb-8">
          <h1 className="text-4xl sm:text-5xl font-oswald font-semibold tracking-[0.02em] uppercase">
            Styleguide
          </h1>
          <p className="mt-2 text-muted max-w-2xl">
            Creamice design system reference. All tokens, type scale, and component examples.
          </p>
        </header>

        <section>
          <h2 className="text-2xl font-oswald font-semibold tracking-[0.02em] uppercase mb-6">
            Colours
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {colors.map((c) => (
              <div
                key={c.token}
                className={`p-4 rounded-[4px] border border-border transition-colors hover:border-border-strong bg-[${c.hex}] text-[${c.text}]`}
                style={{ backgroundColor: c.hex }}
              >
                <div className="font-oswald font-medium uppercase tracking-[0.02em] text-sm mb-1">
                  {c.name}
                </div>
                <div className="text-xs font-mono mb-2">{c.token}</div>
                <div className="text-xs opacity-80">{c.hex}</div>
                <div className="text-xs opacity-60 mt-1">{c.role}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-oswald font-semibold tracking-[0.02em] uppercase mb-6">
            Typography
          </h2>
          <div className="space-y-4">
            {typeScale.map((t) => (
              <div
                key={t.name}
                className="p-4 bg-surface rounded-[4px] border border-border"
              >
                <div className="flex flex-wrap items-baseline gap-4 mb-2">
                  <span className="font-oswald font-medium uppercase tracking-[0.02em]">
                    {t.name}
                  </span>
                  <span className="text-sm text-muted font-mono">
                    {t.mobile} → {t.desktop}
                  </span>
                  <span className="text-sm text-muted font-mono">
                    {t.weight}
                  </span>
                  <span className="text-sm text-muted font-mono">
                    {t.font}
                  </span>
                </div>
                <div
                  className={`font-${t.font.toLowerCase()}`}
                  style={{
                    fontSize: t.mobile.split("/")[0] + "px",
                    lineHeight: t.mobile.split("/")[1] + "px",
                    fontWeight: t.weight.split("-")[1] || t.weight,
                    letterSpacing: t.font === "Oswald" ? "0.02em" : "normal",
                    textTransform: ["Display (Hero)", "H1", "H2"].includes(t.name) ? "uppercase" : "none",
                  }}
                >
                  {t.name === "Label (Buttons)"
                    ? "ADD TO CART"
                    : "The quick brown fox jumps over the lazy dog"}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-oswald font-semibold tracking-[0.02em] uppercase mb-6">
            Buttons
          </h2>
          <div className="flex flex-wrap gap-4">
            {buttons.map((b) => (
              <button
                key={b.variant}
                className={`inline-flex items-center justify-center h-12 px-6 rounded-[4px] font-montserrat font-semibold uppercase tracking-[0.04em] text-sm transition-colors duration-150 ${b.className}`}
              >
                {b.variant}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted max-w-2xl">
            Height 48px, horizontal padding 24px. Primary: Gold fill, Jet Black text.
            Secondary: Transparent, 1px Off-White border. Ghost: No border, underline on hover.
            Danger: Error border and text. Disabled: 40% opacity.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-oswald font-semibold tracking-[0.02em] uppercase mb-6">
            Form Fields
          </h2>
          <div className="bg-surface rounded-[4px] border border-border p-6">
            {formExample}
          </div>
          <p className="mt-4 text-sm text-muted max-w-2xl">
            Height 48px, Charcoal background, 1px Border Strong, 4px radius.
            Label above field. Focus: 2px Gold outline with 2px offset.
            Error: Error-coloured border plus message text below.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-oswald font-semibold tracking-[0.02em] uppercase mb-6">
            Spacing & Radius
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-surface rounded-[4px] border border-border">
              <div className="font-mono text-lg">4px</div>
              <div className="text-xs text-muted">Base unit</div>
            </div>
            <div className="p-4 bg-surface rounded-[4px] border border-border">
              <div className="font-mono text-lg">--radius</div>
              <div className="text-xs text-muted">4px everywhere</div>
            </div>
            <div className="p-4 bg-surface rounded-[4px] border border-border">
              <div className="font-mono text-lg">--dur-fast</div>
              <div className="text-xs text-muted">150ms</div>
            </div>
            <div className="p-4 bg-surface rounded-[4px] border border-border">
              <div className="font-mono text-lg">--dur-base</div>
              <div className="text-xs text-muted">200ms</div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-oswald font-semibold tracking-[0.02em] uppercase mb-6">
            Motion & Reduced Motion
          </h2>
          <div className="bg-surface rounded-[4px] border border-border p-6 space-y-3 text-sm">
            <p><strong>Allowed:</strong> 150ms hover/focus transitions, 200ms drawer/sheet/modal, 200ms content fade-in, 1.03x image scale on hover (desktop), skeleton pulse 1.5s.</p>
            <p><strong>Not allowed:</strong> Parallax, scroll-jacking, auto-carousels, marquees, bouncing, spinning, animated counters, page-load intros, anything over 250ms.</p>
            <p><strong>Reduced motion:</strong> Honoured via @media (prefers-reduced-motion: reduce) — all animations/transitions set to 0.01ms.</p>
          </div>
        </section>

        <footer className="border-t border-border pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gold hover:text-gold-hover transition-colors"
          >
            ← Back to home
          </Link>
        </footer>
      </div>
    </main>
  );
}