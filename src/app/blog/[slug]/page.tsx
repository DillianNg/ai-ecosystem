import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

const ARTICLES: Record<string, { title: string; date: string; category: string; content: string }> = {
  "ai-infrastructure-landscape": {
    title: "AI Infrastructure Landscape",
    date: "May 2026",
    category: "Infrastructure",
    content: `The infrastructure layer sits at the foundation of every AI system deployed today. It encompasses custom silicon design, hyperscale cloud compute, networking fabric, and the storage systems that feed training and inference workloads.

NVIDIA remains the center of gravity, but the landscape is shifting. AMD has gained meaningful share in data-center GPUs, while custom silicon from Google (TPUs), Amazon (Trainium and Inferentia), and a growing cohort of startups like Cerebras, Groq, and SambaNova offer alternative architectures optimized for specific workload profiles.

Cloud providers have become the primary distribution channel. AWS, Azure, and Google Cloud compete on GPU availability, pricing models, and managed ML services. Meanwhile, GPU-cloud specialists like CoreWeave and Lambda Labs have carved out positions by offering bare-metal GPU access with lower abstraction and faster provisioning.

The capital intensity of this layer is staggering. Training frontier models requires clusters worth hundreds of millions of dollars. This concentration of capital creates natural moats but also systemic risk: a small number of fabrication facilities and suppliers control the entire chain from wafer to workload.

Looking ahead, the infrastructure layer will continue to absorb the largest share of AI investment. The key questions are whether alternative architectures can break NVIDIA's dominance, how sovereign AI initiatives reshape geographic distribution, and whether inference costs will decline fast enough to unlock new application categories.`,
  },
  "evolution-of-ai-agents": {
    title: "Evolution of AI Agents",
    date: "April 2026",
    category: "Agents",
    content: `AI agents represent a fundamental shift from tools that respond to prompts toward systems that pursue goals across multiple steps, tools, and time horizons.

The first generation of agents were simple prompt chains: a language model calling a search API, summarizing results, and returning an answer. Useful, but brittle. Error propagation across steps meant reliability dropped exponentially with chain length.

The second generation introduced orchestration frameworks. LangChain, CrewAI, and AutoGen provided abstractions for tool use, memory, and multi-agent coordination. These frameworks lowered the barrier to building agent systems but exposed new challenges around state management, error recovery, and evaluation.

We are now entering a third generation defined by reliability engineering. Companies like Anthropic, OpenAI, and Google are embedding agentic capabilities directly into their models, with built-in tool use, code execution, and computer interaction. The focus has shifted from "can the agent do X" to "can the agent do X reliably, safely, and at scale."

Enterprise adoption is accelerating in domains where the cost of human labor is high and the tolerance for imperfection is reasonable: code review, data analysis, customer support triage, and document processing. Full autonomy remains rare; most production deployments use human-in-the-loop architectures where agents draft and humans approve.

The next frontier is multi-agent systems where specialized agents collaborate on complex workflows. Early results are promising, but coordination protocols, trust boundaries, and accountability frameworks are still being defined.`,
  },
  "mapping-the-modern-ai-stack": {
    title: "Mapping the Modern AI Stack",
    date: "March 2026",
    category: "Analysis",
    content: `Every technology wave produces a layered stack. The internet gave us infrastructure, protocols, platforms, and applications. Mobile added device hardware, operating systems, app stores, and services. AI is no different.

Our mapping uses six layers inspired by Sequoia Capital's ecosystem research. From bottom to top: Infrastructure, Model, Application, Integration, Security, and Monetization. Each layer has distinct economics, competitive dynamics, and investment profiles.

Infrastructure is capital-intensive and concentrated. A handful of chipmakers and cloud providers control the compute substrate. Model is research-intensive and increasingly bifurcated between frontier labs (OpenAI, Anthropic, Google DeepMind) and open-source communities (Meta, Mistral, the broader Hugging Face ecosystem).

The Application layer is where value reaches end users. Vertical AI companies like Harvey (legal), Abridge (healthcare), and Runway (creative tools) are building defensible positions by combining foundation models with domain-specific data and workflows.

Integration covers the connective tissue: orchestration frameworks, vector databases, MLOps platforms, and evaluation tools. This layer is fragmented and evolving rapidly as the abstraction boundaries shift.

Security has emerged as a critical concern. Model vulnerabilities, prompt injection, data poisoning, and compliance requirements have created demand for specialized tools from companies like Robust Intelligence, Lakera, and Hidden Layer.

Monetization sits at the top of the stack, encompassing data labeling (Scale AI), marketplace platforms, and the business models that convert AI capability into revenue.

Understanding these layers helps investors identify opportunities, builders choose partners, and operators plan their AI strategy. The map is not the territory, but it provides a useful frame for navigating an ecosystem that grows more complex every quarter.`,
  },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.keys(ARTICLES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES[slug];
  if (!article) return { title: "Not found" };
  return { title: article.title, description: article.content.slice(0, 160) };
}

export default async function BlogPost({ params }: PageProps) {
  const { slug } = await params;
  const article = ARTICLES[slug];
  if (!article) notFound();

  return (
    <div className="min-h-screen bg-black pt-24 pb-20 px-6 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/blog/"
          className="mb-10 inline-block text-xs text-white/25 hover:text-white/50 transition tracking-widest uppercase"
        >
          ← Blog
        </Link>

        <div className="mb-8 flex items-center gap-4">
          <span className="text-[9px] uppercase tracking-[0.3em] text-white/25">{article.category}</span>
          <span className="text-[9px] text-white/15">{article.date}</span>
        </div>

        <h1 className="text-3xl font-thin text-white sm:text-5xl leading-tight mb-12">
          {article.title}
        </h1>

        <div className="prose-invert">
          {article.content.split("\n\n").map((para, i) => (
            <p key={i} className="mb-6 text-sm leading-[1.85] text-white/50">
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
