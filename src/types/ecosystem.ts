export interface Company {
  id: string;
  name: string;
  logo: string;
  description: string;
  valuation: string;
  founded: number;
  website: string;
  category: string;
  // Phase 1 extensions
  layers: string[];       // multiple layers
  approaches?: string[];  // approaches this company is relevant to
  connections?: string[]; // related company IDs
  tags?: string[];        // free-form tags
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
