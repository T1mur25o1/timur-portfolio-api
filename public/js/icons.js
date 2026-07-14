// Fixed icon + color presets. Kept as a closed set (rather than free-form
// SVG/HTML from the admin form) so admin-authored content can never inject
// arbitrary markup into the public site.

export const ICONS = {
  code: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  shield: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg>',
  bot: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="16" r="1"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  chart: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',
  globe: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z"/></svg>',
};

export const COLORS = {
  cyan: {
    text: "text-neon-cyan",
    border: "hover:border-neon-cyan/60",
    grad: "from-neon-cyan/20 to-neon-cyan/0",
    label: "Cyan",
  },
  green: {
    text: "text-neon-green",
    border: "hover:border-neon-green/60",
    grad: "from-neon-green/20 to-neon-green/0",
    label: "Green",
  },
  violet: {
    text: "text-neon-violet",
    border: "hover:border-neon-violet/60",
    grad: "from-neon-violet/20 to-neon-violet/0",
    label: "Violet",
  },
  fuchsia: {
    text: "text-neon-fuchsia",
    border: "hover:border-neon-fuchsia/60",
    grad: "from-neon-fuchsia/20 to-neon-fuchsia/0",
    label: "Fuchsia",
  },
};

export function iconSvg(key) {
  return ICONS[key] || ICONS.code;
}

export function colorSet(key) {
  return COLORS[key] || COLORS.cyan;
}
