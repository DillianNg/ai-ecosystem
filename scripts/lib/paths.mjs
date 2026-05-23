import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const ROOT = join(__dirname, "../..");
export const CSV_PATH = join(ROOT, "data/companies.csv");
export const AUDIT_PATH = join(ROOT, "data/companies.audit.json");
export const OUTPUT_PATH = join(ROOT, "data/generated/companies.json");
