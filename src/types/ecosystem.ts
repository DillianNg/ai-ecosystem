export interface Company {
  id: string;
  name: string;
  logo: string;
  description: string;
  valuation: string;
  founded: number | null;
  website: string;
  category: string;
  layers: string[];
  approaches?: string[];
  connections?: string[];
  tags?: string[];
  products?: string[];
  fundingStage?: string;
  employees?: string;
  headquarters?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

export interface NewsItem {
  title: string;
  date: string;
  summary: string;
  link: string;
}

export interface Layer {
  id: string;
  name: string;
  description: string;
  fullDescription: string;
  fundingStatus: string;
  fundingPercent: number;
  companyCount: number;
  growthTrend: number;
  companies: Company[];
  news: NewsItem[];
}

export interface EcosystemData {
  meta: {
    title: string;
    description: string;
    lastUpdated: string;
  };
  layers: Layer[];
}

export type CompanySort = "funding" | "alphabet" | "category";
export type CompanySortOrder = "asc" | "desc";
