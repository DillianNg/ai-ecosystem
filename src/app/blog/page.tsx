import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog",
  description: "Insights on the AI ecosystem, infrastructure, and emerging trends.",
};

const POSTS = [
  {
    slug: "ai-infrastructure-landscape",
    title: "AI Infrastructure Landscape",
    date: "May 2026",
    category: "Infrastructure",
    excerpt:
      "From custom silicon to hyperscale clouds, the infrastructure underpinning AI has become the highest-stakes layer in the entire stack. We map the major players, the capital flows, and the architectural decisions shaping the next decade.",
    readTime: "8 min",
  },
  {
    slug: "evolution-of-ai-agents",
    title: "Evolution of AI Agents",
    date: "April 2026",
    category: "Agents",
    excerpt:
      "Agents have moved from demos to deployment. This piece traces the arc from simple prompt chains to multi-agent orchestration frameworks, and asks what the shift means for enterprise software and human work.",
    readTime: "6 min",
  },
  {
    slug: "mapping-the-modern-ai-stack",
    title: "Mapping the Modern AI Stack",
    date: "March 2026",
    category: "Analysis",
    excerpt:
      "Six layers. Hundreds of companies. One coherent picture. We break down the Sequoia-inspired framing behind this map, explain why each layer exists, and show where capital is concentrating fastest.",
    readTime: "10 min",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-black pt-24 pb-20 px-6 sm:px-10 lg:px-16">
      <div className="mb-16">
        <p className="text-[10px] uppercase tracking-[0.35em] text-white/25 mb-3">
          Perspectives
        </p>
        <h1 className="text-4xl font-thin text-white sm:text-6xl">Blog</h1>
      </div>

      <div className="grid gap-px bg-white/5 sm:grid-cols-1 lg:grid-cols-3 rounded-2xl overflow-hidden">
        {POSTS.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}/`}
            className="group flex flex-col bg-black p-8 transition hover:bg-white/3"
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-[0.3em] text-white/25">
                {post.category}
              </span>
              <span className="text-[9px] text-white/20">{post.readTime}</span>
            </div>

            <h2 className="text-xl font-light text-white transition group-hover:text-white/90 mb-4 leading-snug">
              {post.title}
            </h2>

            <p className="flex-1 text-sm leading-relaxed text-white/35 line-clamp-4">
              {post.excerpt}
            </p>

            <div className="mt-8 flex items-center justify-between">
              <span className="text-xs text-white/20">{post.date}</span>
              <span className="text-xs text-white/30 transition group-hover:text-white/70">
                Read →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
