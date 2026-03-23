import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

const src = "d:/hero claude/Hero.css";
const out = path.join(projectRoot, "src/components/Hero.css");

let o = fs.readFileSync(src, "utf8");

o = o.replace(/@import url\([^)]+\);\s*/g, "");
o = o.replace(/\*\/\s*\*, \*::before, \*::after \{[^}]+\}\s*/g, "*/\n\n");
o = o.replace(":root {", ".lrvh-root {");
o = o.replace(/\.lrv-root/g, ".lrvh-root");

// Remove navbar block
o = o.replace(
  /\/\* ════════════════════════════════\s*NAVBAR[\s\S]*?(?=\/\* ════════════════════════════════\s*HERO SECTION)/,
  "",
);

o = o.replace(/\.bg-base/g, ".lrvh-bg-base");
o = o.replace(/\.bg-orb/g, ".lrvh-bg-orb");
o = o.replace(/\.orb-1/g, ".lrvh-bg-orb--1");
o = o.replace(/\.orb-2/g, ".lrvh-bg-orb--2");
o = o.replace(/\.orb-3/g, ".lrvh-bg-orb--3");
o = o.replace(/@keyframes orb-drift/g, "@keyframes lrvh-orb-drift");
o = o.replace(/orb-drift/g, "lrvh-orb-drift");
o = o.replace(/lrvh-lrvh-orb-drift/g, "lrvh-orb-drift");
o = o.replace(/\.bg-grid/g, ".lrvh-bg-grid");
o = o.replace(/\.noise-overlay/g, ".lrvh-noise-overlay");

o = o.replace(/\.loaded/g, ".lrvh-root--loaded");

o = o.replace(/\.hero\s*\{/g, ".lrvh-main {");
o = o.replace(/\.hero-left/g, ".lrvh-main-left");
o = o.replace(/\.hero-right/g, ".lrvh-main-right");

o = o.replace(/\.eyebrow-line/g, ".lrvh-eyebrow-line");
o = o.replace(/\.eyebrow-dot/g, ".lrvh-eyebrow-dot");
o = o.replace(/\.eyebrow/g, ".lrvh-eyebrow");

o = o.replace(/\.title-line\.line-1/g, ".lrvh-title-line.lrvh-title-line--1");
o = o.replace(/\.title-line\.line-2/g, ".lrvh-title-line.lrvh-title-line--2");
o = o.replace(/\.title-line\.line-3/g, ".lrvh-title-line.lrvh-title-line--3");
o = o.replace(/\.title-line/g, ".lrvh-title-line");
o = o.replace(/\.title-accent/g, ".lrvh-title-accent");

o = o.replace(/\.hero-title/g, ".lrvh-title");
o = o.replace(/\.hero-subtitle/g, ".lrvh-subtitle");

o = o.replace(/\.features-row/g, ".lrvh-features-row");
o = o.replace(/\.feature-chip/g, ".lrvh-feature-chip");
o = o.replace(/\.chip-icon/g, ".lrvh-chip-icon");
o = o.replace(/\.chip-title/g, ".lrvh-chip-title");
o = o.replace(/\.chip-desc/g, ".lrvh-chip-desc");

o = o.replace(/\.cta-row/g, ".lrvh-cta-row");
o = o.replace(/\.btn-sec-icon/g, ".lrvh-btn-sec-icon");
o = o.replace(/\.btn-secondary/g, ".lrvh-btn.lrvh-btn--secondary");
o = o.replace(/\.btn-primary/g, ".lrvh-btn.lrvh-btn--primary");

o = o.replace(/\.stats-row/g, ".lrvh-stats-row");
o = o.replace(/\.stat-item/g, ".lrvh-stat-item");
o = o.replace(/\.stat-value/g, ".lrvh-stat-value");
o = o.replace(/\.stat-label/g, ".lrvh-stat-label");

o = o.replace(/\.card-wrap/g, ".lrvh-card-wrap");
o = o.replace(/\.main-card:hover/g, ".lrvh-main-card:hover");
o = o.replace(/\.main-card/g, ".lrvh-main-card");
o = o.replace(/\.card-glow/g, ".lrvh-card-glow");
o = o.replace(/\.property-img/g, ".lrvh-property-img");
o = o.replace(/\.card-overlay/g, ".lrvh-card-overlay");
o = o.replace(/\.overlay-badge/g, ".lrvh-overlay-badge");
o = o.replace(/\.badge-dot/g, ".lrvh-badge-dot");
o = o.replace(/\.overlay-info/g, ".lrvh-overlay-info");
o = o.replace(/\.prop-name/g, ".lrvh-prop-name");
o = o.replace(/\.prop-price/g, ".lrvh-prop-price");
o = o.replace(/\.card-shine/g, ".lrvh-card-shine");

o = o.replace(/\.float-tl/g, ".lrvh-float-card--tl");
o = o.replace(/\.float-br/g, ".lrvh-float-card--br");
o = o.replace(/\.float-tr/g, ".lrvh-float-card--tr");
o = o.replace(/\.float-card/g, ".lrvh-float-card");

o = o.replace(/\.fc-stars/g, ".lrvh-fc-stars");
o = o.replace(/\.fc-icon/g, ".lrvh-fc-icon");
o = o.replace(/\.fc-label/g, ".lrvh-fc-label");
o = o.replace(/\.fc-val/g, ".lrvh-fc-val");
o = o.replace(/\.fc-avatar-row/g, ".lrvh-fc-avatar-row");
o = o.replace(/\.av-3/g, ".lrvh-fc-avatar--3");
o = o.replace(/\.av-2/g, ".lrvh-fc-avatar--2");
o = o.replace(/\.fc-avatar/g, ".lrvh-fc-avatar");

o = o.replace(/\.ring-2/g, ".lrvh-deco-ring--2");
o = o.replace(/\.ring-1/g, ".lrvh-deco-ring--1");
o = o.replace(/\.deco-ring/g, ".lrvh-deco-ring");

if (!o.includes("--green-600:")) {
  o = o.replace("--green-500:", "--green-600: #16a36e;\n  --green-500:");
}

o = o.replace(/\.nav-links, \.nav-cta \{ display: none; \}\s*\.nav-burger \{ display: flex; \}\s*/g, "");

o += `

.lrvh-root--reduced .lrvh-bg-orb { animation: none !important; }
.lrvh-root--reduced .lrvh-main-card { animation: none !important; }
.lrvh-root--reduced .lrvh-card-glow { animation: none !important; }
.lrvh-root--reduced .lrvh-float-card { animation: none !important; }
.lrvh-root--reduced .lrvh-deco-ring { animation: none !important; }
.lrvh-root--reduced .lrvh-card-shine { animation: none !important; }
.lrvh-root--reduced .lrvh-badge-dot { animation: none !important; }

.lrvh-img-placeholder {
  width: 100%;
  height: 100%;
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f7f0, #d8f2e9);
  color: var(--muted);
  font-size: 0.9rem;
  padding: 1rem;
  text-align: center;
}
`;

fs.writeFileSync(out, o);
console.log("Written", out, o.length);
