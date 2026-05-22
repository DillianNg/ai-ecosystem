import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const layersConfig = [
  { id: "infrastructure", name: "Infrastructure", desc: "Compute, chips, and cloud powering AI workloads.", full: "The infrastructure layer spans semiconductors, hyperscale cloud, specialized AI compute, and networking. Capital flows here fund the physical foundation of the entire ecosystem.", funding: "$186B", pct: 92, growth: 28, count: 48 },
  { id: "model", name: "Model", desc: "Foundation models and research labs building core intelligence.", full: "Model-layer companies develop frontier LLMs, multimodal systems, and open-weight ecosystems. Funding concentrates on training scale, talent density, and proprietary data moats.", funding: "$124B", pct: 78, growth: 34, count: 36 },
  { id: "application", name: "Application", desc: "Vertical AI products transforming industries and workflows.", full: "Application-layer startups productize AI into legal, healthcare, creative, sales, and enterprise workflows.", funding: "$89B", pct: 71, growth: 41, count: 62 },
  { id: "integration", name: "Integration", desc: "Tooling, APIs, and platforms connecting models to products.", full: "Integration covers orchestration frameworks, MLOps, vector databases, and developer platforms.", funding: "$42B", pct: 65, growth: 38, count: 44 },
  { id: "security", name: "Security", desc: "Safety, governance, and threat defense for AI systems.", full: "Security layer firms address model risk, prompt injection, data leakage, compliance, and red-teaming.", funding: "$18B", pct: 58, growth: 45, count: 28 },
  { id: "monetization", name: "Monetization", desc: "Data marketplaces, billing, and revenue infrastructure.", full: "Monetization includes data labeling, RLHF services, usage-based billing, and marketplaces.", funding: "$31B", pct: 62, growth: 33, count: 34 },
];

const companiesByLayer = {
  infrastructure: [["nvidia","NVIDIA","GPU and AI accelerator leader.","$3.2T",1993,"Semiconductors","https://www.nvidia.com"],["amd","AMD","CPUs and AI GPUs.","$280B",1969,"Semiconductors","https://www.amd.com"],["coreweave","CoreWeave","GPU cloud for AI.","$19B",2017,"Cloud","https://www.coreweave.com"],["lambda","Lambda","GPU cloud clusters.","$1.5B",2012,"Cloud","https://lambdalabs.com"],["cerebras","Cerebras","Wafer-scale AI processors.","$4.1B",2016,"Chips","https://www.cerebras.net"],["groq","Groq","LPU inference chips.","$2.8B",2016,"Chips","https://groq.com"],["aws","AWS","Hyperscale AI cloud.","N/A",2006,"Cloud","https://aws.amazon.com"],["google-cloud","Google Cloud","TPU-backed infrastructure.","N/A",2008,"Cloud","https://cloud.google.com"],["azure","Microsoft Azure","OpenAI-scale GPU regions.","N/A",2010,"Cloud","https://azure.microsoft.com"],["databricks","Databricks","Unified data + AI platform.","$43B",2013,"Platform","https://www.databricks.com"],["snowflake","Snowflake","Data cloud for AI workloads.","$55B",2012,"Data","https://www.snowflake.com"],["nebius","Nebius","European AI cloud.","$2.2B",2024,"Cloud","https://nebius.com"]],
  model: [["openai","OpenAI","GPT and enterprise AI.","$300B",2015,"Foundation","https://openai.com"],["anthropic","Anthropic","Claude models.","$61B",2021,"Foundation","https://www.anthropic.com"],["google-deepmind","Google DeepMind","Gemini research.","N/A",2010,"Foundation","https://deepmind.google"],["meta-ai","Meta AI","Llama open models.","N/A",2013,"Open Weights","https://ai.meta.com"],["mistral","Mistral AI","European frontier models.","$14B",2023,"Foundation","https://mistral.ai"],["cohere","Cohere","Enterprise LLMs.","$7B",2019,"Enterprise","https://cohere.com"],["ai21","AI21 Labs","Jurassic models.","$1.4B",2017,"Foundation","https://www.ai21.com"],["stability","Stability AI","Diffusion models.","$1B",2020,"Multimodal","https://stability.ai"],["inflection","Inflection AI","Personal AI Pi.","$4B",2022,"Consumer","https://inflection.ai"],["xai","xAI","Grok models.","$50B",2023,"Foundation","https://x.ai"],["perplexity","Perplexity","Answer engine.","$18B",2022,"Search","https://www.perplexity.ai"],["aleph-alpha","Aleph Alpha","Sovereign EU AI.","$1.1B",2019,"Foundation","https://aleph-alpha.com"]],
  application: [["harvey","Harvey","Legal AI platform.","$8B",2022,"Legal","https://www.harvey.ai"],["runway","Runway","Generative video.","$3B",2018,"Creative","https://runwayml.com"],["character-ai","Character.AI","Conversational agents.","$5B",2021,"Consumer","https://character.ai"],["jasper","Jasper","Marketing AI.","$1.5B",2021,"Marketing","https://www.jasper.ai"],["notion-ai","Notion AI","Workspace AI.","N/A",2016,"Productivity","https://www.notion.so"],["github-copilot","GitHub Copilot","AI pair programmer.","N/A",2008,"DevTools","https://github.com/features/copilot"],["cursor","Cursor","AI code editor.","$9.9B",2022,"DevTools","https://cursor.com"],["sierra","Sierra","CX agents.","$4.5B",2023,"Enterprise","https://sierra.ai"],["glean","Glean","Enterprise work AI.","$7.2B",2019,"Enterprise","https://www.glean.com"],["adept","Adept","Action models.","$1B",2022,"Automation","https://www.adept.ai"],["synthesia","Synthesia","AI video avatars.","$2.1B",2017,"Video","https://www.synthesia.io"],["hebbia","Hebbia","Finance document AI.","$700M",2020,"Finance","https://www.hebbia.com"]],
  integration: [["langchain","LangChain","LLM app framework.","$1.25B",2022,"Orchestration","https://www.langchain.com"],["huggingface","Hugging Face","Model hub.","$4.5B",2016,"Platform","https://huggingface.co"],["wandb","Weights & Biases","MLOps tracking.","$200M",2017,"MLOps","https://wandb.ai"],["pinecone","Pinecone","Vector DB for RAG.","$750M",2019,"Vector DB","https://www.pinecone.io"],["weaviate","Weaviate","Vector search.","$125M",2019,"Vector DB","https://weaviate.io"],["arize","Arize AI","LLM observability.","$130M",2020,"Observability","https://arize.com"],["humanloop","Humanloop","Prompt management.","$50M",2020,"Prompting","https://humanloop.com"],["unstructured","Unstructured","LLM document ETL.","$65M",2022,"Data","https://unstructured.io"],["modal","Modal","Serverless GPU.","$1.1B",2021,"Compute","https://modal.com"],["replicate","Replicate","Model API hosting.","$350M",2019,"Inference","https://replicate.com"],["anyscale","Anyscale","Ray AI runtime.","$1B",2019,"Runtime","https://www.anyscale.com"],["mlflow","MLflow","ML lifecycle OSS.","N/A",2018,"MLOps","https://mlflow.org"]],
  security: [["robust-intelligence","Robust Intelligence","AI firewall.","$100M",2019,"Model Security","https://www.robustintelligence.com"],["hiddenlayer","Hidden Layer","ML security.","$50M",2022,"MLSec","https://hiddenlayer.com"],["lakera","Lakera","Prompt injection defense.","$20M",2021,"Guardrails","https://www.lakera.ai"],["calypsoai","CalypsoAI","Secure AI gateway.","$38M",2018,"Gateway","https://calypsoai.com"],["cranium","Cranium","AI GRC platform.","$25M",2021,"GRC","https://cranium.ai"],["protect-ai","Protect AI","MLSOC security.","$60M",2022,"MLSOC","https://protectai.com"],["witnessai","WitnessAI","AI activity monitoring.","$27M",2023,"Monitoring","https://witness.ai"],["aim-security","AIM Security","AI governance.","$18M",2023,"Governance","https://www.aim.security"],["nightfall","Nightfall AI","Gen AI DLP.","$33M",2018,"DLP","https://www.nightfall.ai"],["openai-safety","OpenAI Safety","Alignment research.","N/A",2015,"Research","https://openai.com/safety"],["anthropic-safety","Anthropic Safety","Constitutional AI.","N/A",2021,"Research","https://www.anthropic.com/research"],["crowdstrike","CrowdStrike","AI-powered cyber.","$95B",2011,"Cyber","https://www.crowdstrike.com"]],
  monetization: [["scale-ai","Scale AI","RLHF and labeling.","$14B",2016,"Data","https://scale.com"],["surge-ai","Surge AI","Human feedback data.","$1B",2020,"Data","https://www.surgehq.ai"],["labelbox","Labelbox","Training data platform.","$110M",2018,"Data","https://labelbox.com"],["stripe","Stripe","Usage-based billing.","$95B",2010,"Payments","https://stripe.com"],["openrouter","OpenRouter","Model API marketplace.","$50M",2023,"Marketplace","https://openrouter.ai"],["revenuecat","RevenueCat","Subscription infra.","$500M",2017,"Billing","https://www.revenuecat.com"],["paddle","Paddle","MoR for SaaS AI.","$1.4B",2012,"Billing","https://www.paddle.com"],["datarobot","DataRobot","Enterprise AI ROI.","$6.3B",2012,"Analytics","https://www.datarobot.com"],["helicone","Helicone","LLM cost tracking.","$15M",2023,"FinOps","https://www.helicone.ai"],["langfuse","Langfuse","LLM analytics OSS.","$10M",2022,"Analytics","https://langfuse.com"],["predibase","Predibase","Fine-tune serving.","$28M",2021,"Serving","https://predibase.com"],["together","Together AI","Inference marketplace.","$3.3B",2022,"Marketplace","https://www.together.ai"]],
};

const newsTemplates = [
  ["Major funding round signals layer momentum", "Venture capital concentrates in category leaders as enterprises accelerate adoption."],
  ["Enterprise adoption drives new partnerships", "Fortune 500 pilots expand from proof-of-concept to production deployments."],
  ["Regulatory clarity shapes investment thesis", "US and EU policy frameworks influence how investors price risk."],
  ["Open-source alternatives challenge incumbents", "Efficient architectures and community roadmaps undercut pricing."],
  ["Consolidation wave expected in 2026", "Analysts predict M&A as compute costs reshape competitive dynamics."],
];

function buildCompanies(layerId) {
  return companiesByLayer[layerId].map(([id, name, desc, val, founded, cat, web]) => ({
    id,
    name,
    logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`,
    description: desc,
    valuation: val,
    founded,
    website: web,
    category: cat,
    social: {
      twitter: `https://twitter.com/search?q=${encodeURIComponent(name)}`,
      linkedin: `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(name)}`,
    },
  }));
}

const layers = layersConfig.map((l) => ({
  id: l.id,
  name: l.name,
  description: l.desc,
  fullDescription: l.full,
  fundingStatus: l.funding,
  fundingPercent: l.pct,
  companyCount: l.count,
  growthTrend: l.growth,
  companies: buildCompanies(l.id),
  news: newsTemplates.map(([title, summary], i) => ({
    title: `${l.name}: ${title}`,
    date: `2026-0${5 - i}-${String(10 + i * 3).padStart(2, "0")}`,
    summary,
    link: `https://news.google.com/search?q=${encodeURIComponent(l.name + " AI")}`,
  })),
}));

const data = {
  meta: {
    title: "AI Ecosystem Map",
    description: "Interactive map of the AI stack across six layers.",
    lastUpdated: "2026-05-23",
  },
  layers,
};

const srcPath = join(root, "src/data/ecosystem.json");
const pubPath = join(root, "public/data.json");
writeFileSync(srcPath, JSON.stringify(data, null, 2));
writeFileSync(pubPath, JSON.stringify(data, null, 2));
console.log("Generated ecosystem data");
