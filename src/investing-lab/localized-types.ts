import type { CompanyStructure } from "./types";

/**
 * The translatable half of a fictional company — lives under
 * `investingLab.companies.<id>` in each locale's messages/*.json,
 * combined with CompanyStructure (structures.ts) the same way lesson
 * and game content is split elsewhere in this app. Company NAMEs are
 * treated like brand names (see test-no-english-fallback.ts's
 * ALLOWED_IDENTICAL list) and stay the same across languages, matching
 * how "Money Quest" itself and the companion characters' names do —
 * only the description is genuinely translated per language.
 */
export interface LocalizedCompanyText {
  name: string;
  description: string;
}

export interface DisplayCompany extends CompanyStructure, LocalizedCompanyText {}

type Translator = { raw: (key: string) => unknown };

export function getLocalizedCompanies(companies: CompanyStructure[], t: Translator): DisplayCompany[] {
  return companies.map((company) => {
    const text = t.raw(`investingLab.companies.${company.id}`) as LocalizedCompanyText;
    return { ...company, ...text };
  });
}

export function getLocalizedCompany(company: CompanyStructure, t: Translator): DisplayCompany {
  const text = t.raw(`investingLab.companies.${company.id}`) as LocalizedCompanyText;
  return { ...company, ...text };
}
