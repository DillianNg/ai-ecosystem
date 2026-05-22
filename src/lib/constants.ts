export const LAYER_ACCENTS: Record<
  string,
  { from: string; to: string; ring: string; text: string }
> = {
  infrastructure: {
    from: "from-sky-500",
    to: "to-blue-700",
    ring: "ring-sky-500/40",
    text: "text-sky-400",
  },
  model: {
    from: "from-violet-500",
    to: "to-purple-800",
    ring: "ring-violet-500/40",
    text: "text-violet-400",
  },
  application: {
    from: "from-emerald-500",
    to: "to-teal-700",
    ring: "ring-emerald-500/40",
    text: "text-emerald-400",
  },
  integration: {
    from: "from-amber-500",
    to: "to-orange-700",
    ring: "ring-amber-500/40",
    text: "text-amber-400",
  },
  security: {
    from: "from-rose-500",
    to: "to-red-800",
    ring: "ring-rose-500/40",
    text: "text-rose-400",
  },
  monetization: {
    from: "from-fuchsia-500",
    to: "to-pink-800",
    ring: "ring-fuchsia-500/40",
    text: "text-fuchsia-400",
  },
};

export const SITE_NAME = "AI Ecosystem Map";
