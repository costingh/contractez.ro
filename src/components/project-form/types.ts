import type { LocalityValue } from "@/components/shared/locality-combobox";

export type BudgetType = "fixed" | "hourly" | "monthly" | "unknown";
export type WorkMode = "remote" | "on_site" | "hybrid";
export type Invoice = "required" | "preferred" | "not_needed";
export type Urgency = "flexible" | "this_month" | "this_week" | "urgent";

/** Starea formularului de proiect (controlat, ca să poată fi precompletat de AI). */
export type ProjectFormValues = {
  title: string;
  description: string;
  categoryId: number | null;
  skills: string[];
  attributes: Record<string, string | number | boolean>;
  budgetType: BudgetType;
  budgetMin: string;
  budgetMax: string;
  estimatedHours: string;
  workMode: WorkMode;
  locality: LocalityValue;
  radiusKm: number;
  invoice: Invoice;
  urgency: Urgency;
  startDate: string;
  durationText: string;
  allowAutoBids: boolean;
  source: "web" | "import";
  sourceText: string | null;
};

export const emptyProjectValues: ProjectFormValues = {
  title: "",
  description: "",
  categoryId: null,
  skills: [],
  attributes: {},
  budgetType: "fixed",
  budgetMin: "",
  budgetMax: "",
  estimatedHours: "",
  workMode: "remote",
  locality: null,
  radiusKm: 50,
  invoice: "preferred",
  urgency: "flexible",
  startDate: "",
  durationText: "",
  allowAutoBids: true,
  source: "web",
  sourceText: null,
};

export type CategoryAttribute = {
  key: string;
  label: string;
  kind: string;
  options: string[] | null;
  unit: string | null;
};

export type QualityView = {
  score: number;
  missing: string[];
  questions: string[];
  budgetInsight: string | null;
  summary?: string | null;
  source: "ai" | "rules";
};

export type ProjectFormState =
  | {
      ok: boolean;
      message?: string;
      error?: string;
      code?: string;
      projectId?: string;
      status?: string;
      warnings?: string[];
      fieldErrors?: Record<string, string>;
    }
  | null;
