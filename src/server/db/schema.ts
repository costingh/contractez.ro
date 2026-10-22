import { sql } from "drizzle-orm";
import type { SocialLinks } from "../../lib/social-links";
import {
  bigserial,
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const geography = customType<{ data: string; driverData: string }>({
  dataType() {
    return "geography(Point, 4326)";
  },
});

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/** Coloană geografică generată din lat/lng, folosită de PostGIS pentru rază și distanță. */
const geoPoint = (name = "geo") =>
  geography(name).generatedAlwaysAs(
    sql`(CASE WHEN lat IS NOT NULL AND lng IS NOT NULL THEN ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography END)`,
  );

/* -------------------------------------------------------------------------- */
/*                                    Enums                                   */
/* -------------------------------------------------------------------------- */

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const tokenType = pgEnum("token_type", ["email_verify", "password_reset", "phone_otp", "email_change"]);
export const legalEntityType = pgEnum("legal_entity_type", ["none", "pfa", "ii", "srl", "other"]);
export const pricingModel = pgEnum("pricing_model", ["hourly", "fixed", "quote"]);
export const priceUnit = pgEnum("price_unit", ["hour", "project", "day", "sqm", "unit", "month"]);
export const availability = pgEnum("availability", ["available", "busy", "unavailable"]);
export const workMode = pgEnum("work_mode", ["remote", "on_site", "hybrid"]);
export const invoiceRequirement = pgEnum("invoice_requirement", ["required", "preferred", "not_needed"]);
export const urgency = pgEnum("urgency", ["flexible", "this_month", "this_week", "urgent"]);
export const budgetType = pgEnum("budget_type", ["fixed", "hourly", "monthly", "unknown"]);
export const projectStatus = pgEnum("project_status", [
  "draft",
  "pending_review",
  "open",
  "in_progress",
  "closed",
  "cancelled",
  "removed",
]);
export const projectSource = pgEnum("project_source", ["web", "import", "admin"]);
export const applicationStatus = pgEnum("application_status", [
  "submitted",
  "viewed",
  "shortlisted",
  "rejected",
  "hired",
  "withdrawn",
  "refunded",
]);
export const priceType = pgEnum("price_type", ["fixed", "hourly", "monthly", "to_discuss"]);
export const subscriptionStatus = pgEnum("subscription_status", [
  "incomplete",
  "active",
  "past_due",
  "canceled",
]);
export const autoBidMode = pgEnum("auto_bid_mode", ["review", "automatic"]);
export const autoBidExecutionStatus = pgEnum("auto_bid_execution_status", [
  "proposed",
  "applied",
  "skipped",
  "declined",
  "expired",
  "failed",
]);
export const digestFrequency = pgEnum("digest_frequency", ["instant", "daily", "weekly", "off"]);
export const collaborationStatus = pgEnum("collaboration_status", [
  "pending_confirmation",
  "active",
  "completed",
  "cancelled",
]);
export const reportTarget = pgEnum("report_target", ["project", "user", "application", "message", "review"]);
export const reportReason = pgEnum("report_reason", [
  "spam",
  "fraud",
  "fake_project",
  "duplicate",
  "abusive",
  "inappropriate",
  "other",
]);
export const reportStatus = pgEnum("report_status", ["open", "resolved", "dismissed"]);
export const emailStatus = pgEnum("email_status", ["queued", "sent", "logged", "failed"]);
export const outreachKind = pgEnum("outreach_kind", ["post", "comment"]);
export const outreachStatus = pgEnum("outreach_status", [
  "new",
  "scored",
  "irrelevant",
  "contacted",
  "skipped",
  "already_contacted",
  "replied",
  "signed_up",
]);
export const outreachType = pgEnum("outreach_type", ["client", "provider", "irrelevant"]);

export type CompanyVerification = {
  cui: string;
  name: string;
  legalForm: string;
  regCom: string | null;
  caen: string | null;
  vatPayer: boolean;
  eInvoice: boolean;
  registeredAt: string | null;
  county: string | null;
  locality: string | null;
  active: boolean;
  checkedAt: string;
};

/* -------------------------------------------------------------------------- */
/*                                  Identity                                  */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    /** „oauth” = cont creat cu Google, fără parolă setată (se poate seta prin „Am uitat parola”). */
    passwordHash: text("password_hash").notNull(),
    googleId: text("google_id"),
    name: text("name").notNull(),
    phone: text("phone"),
    phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    role: userRole("role").notNull().default("user"),
    isClient: boolean("is_client").notNull().default(false),
    isProvider: boolean("is_provider").notNull().default(false),
    /** A ales „Ofer servicii” la onboarding (pasul 1); `isProvider` devine true abia după salvarea profilului (pasul 2). */
    wantsProvider: boolean("wants_provider").notNull().default(false),
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
    avatarPath: text("avatar_path"),
    localityId: integer("locality_id").references(() => localities.id),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    issuesInvoice: boolean("issues_invoice").notNull().default(false),
    legalEntity: legalEntityType("legal_entity").notNull().default("none"),
    companyName: text("company_name"),
    companyCui: text("company_cui"),
    /** Confirmare ANAF: firma există și este activă (NU dovedește că utilizatorul o reprezintă). */
    companyVerifiedAt: timestamp("company_verified_at", { withTimezone: true }),
    companyVerification: jsonb("company_verification").$type<CompanyVerification>(),
    stripeCustomerId: text("stripe_customer_id"),
    /** Id-ul de vizitator VisitTrack din browser (pentru evenimentele trimise de pe server și atribuirea plăților). */
    vtVisitorId: text("vt_visitor_id"),
    referralCode: text("referral_code"),
    referredById: uuid("referred_by_id"),
    /** Prestator activat (email confirmat + onboarding): marchează o singură dată recompensa pentru recomandare. */
    welcomeCreditsGrantedAt: timestamp("welcome_credits_granted_at", { withTimezone: true }),
    bannedAt: timestamp("banned_at", { withTimezone: true }),
    banReason: text("ban_reason"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("users_email_uq").on(sql`lower(${t.email})`),
    uniqueIndex("users_referral_code_uq").on(t.referralCode),
    uniqueIndex("users_google_id_uq").on(t.googleId),
    // Un CUI poate fi confirmat pe un singur cont (evită folosirea datelor altei firme).
    uniqueIndex("users_verified_cui_uq").on(t.companyCui).where(sql`${t.companyVerifiedAt} IS NOT NULL`),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // sha256(token)
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: tokenType("type").notNull(),
    tokenHash: text("token_hash").notNull(),
    target: text("target"), // ex: numărul de telefon pentru OTP, adresa nouă pentru schimbarea emailului
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("verification_tokens_lookup_idx").on(t.type, t.tokenHash)],
);

/* -------------------------------------------------------------------------- */
/*                                  Geography                                 */
/* -------------------------------------------------------------------------- */

export const localities = pgTable(
  "localities",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    county: text("county").notNull(),
    countyCode: text("county_code").notNull(),
    population: integer("population").notNull().default(0),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    geo: geoPoint(),
    searchName: text("search_name").notNull(), // nume normalizat, fără diacritice
  },
  (t) => [
    index("localities_search_trgm_idx").using("gin", sql`${t.searchName} gin_trgm_ops`),
    index("localities_county_idx").on(t.countyCode),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                  Taxonomy                                  */
/* -------------------------------------------------------------------------- */

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    icon: text("icon"),
    parentId: integer("parent_id"),
    sortOrder: integer("sort_order").notNull().default(0),
    typicalWorkMode: workMode("typical_work_mode").notNull().default("hybrid"),
  },
  (t) => [uniqueIndex("categories_slug_uq").on(t.slug), index("categories_parent_idx").on(t.parentId)],
);

export const skills = pgTable(
  "skills",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  },
  (t) => [uniqueIndex("skills_slug_uq").on(t.slug), index("skills_category_idx").on(t.categoryId)],
);

/** Atribute specifice categoriei (ex: suprafață pentru renovări, tip site pentru web). */
export const categoryAttributes = pgTable("category_attributes", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  label: text("label").notNull(),
  kind: text("kind").notNull(), // text | number | select | boolean
  options: jsonb("options").$type<string[]>(),
  unit: text("unit"),
  sortOrder: integer("sort_order").notNull().default(0),
});

/* -------------------------------------------------------------------------- */
/*                                  Providers                                 */
/* -------------------------------------------------------------------------- */

export const providerProfiles = pgTable(
  "provider_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    headline: text("headline").notNull().default(""),
    bio: text("bio").notNull().default(""),
    pricingModel: pricingModel("pricing_model").notNull().default("hourly"),
    hourlyRate: integer("hourly_rate"), // lei / oră
    minProjectBudget: integer("min_project_budget"), // lei
    remote: boolean("remote").notNull().default(true),
    onSite: boolean("on_site").notNull().default(false),
    travelRadiusKm: integer("travel_radius_km").notNull().default(25),
    localityId: integer("locality_id").references(() => localities.id),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    geo: geoPoint(),
    yearsExperience: integer("years_experience"),
    languages: text("languages").array().notNull().default(sql`ARRAY['ro']::text[]`),
    availability: availability("availability").notNull().default("available"),
    hoursPerWeek: integer("hours_per_week"),
    websiteUrl: text("website_url"),
    /** Profiluri sociale/profesionale, deja validate și normalizate (un link per rețea). */
    socialLinks: jsonb("social_links").$type<SocialLinks>().notNull().default({}),
    /** Imaginea de copertă (banner) de pe profilul public, în `public/covers`. */
    coverPath: text("cover_path"),
    certifications: text("certifications"),
    responseTimeMinutes: integer("response_time_minutes"),
    ratingAvg: doublePrecision("rating_avg"),
    ratingCount: integer("rating_count").notNull().default(0),
    completedCount: integer("completed_count").notNull().default(0),
    applicationsCount: integer("applications_count").notNull().default(0),
    profileViews: integer("profile_views").notNull().default(0),
    boostedUntil: timestamp("boosted_until", { withTimezone: true }),
    featuredUntil: timestamp("featured_until", { withTimezone: true }),
    searchText: text("search_text").notNull().default(""),
    searchVector: tsvector("search_vector").generatedAlwaysAs(sql`to_tsvector('simple', search_text)`),
    isPublic: boolean("is_public").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("provider_profiles_slug_uq").on(t.slug),
    index("provider_profiles_geo_idx").using("gist", t.geo),
    index("provider_profiles_search_idx").using("gin", t.searchVector),
  ],
);

export const providerCategories = pgTable(
  "provider_categories",
  {
    providerId: uuid("provider_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.providerId, t.categoryId] }), index("provider_categories_cat_idx").on(t.categoryId)],
);

export const providerSkills = pgTable(
  "provider_skills",
  {
    providerId: uuid("provider_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.providerId, t.skillId] }), index("provider_skills_skill_idx").on(t.skillId)],
);

export const providerServices = pgTable(
  "provider_services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    priceFrom: integer("price_from"),
    priceUnit: priceUnit("price_unit").notNull().default("hour"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("provider_services_provider_idx").on(t.providerId)],
);

export const portfolioItems = pgTable(
  "portfolio_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    url: text("url"),
    imagePath: text("image_path"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("portfolio_items_provider_idx").on(t.providerId)],
);

/* -------------------------------------------------------------------------- */
/*                                  Projects                                  */
/* -------------------------------------------------------------------------- */

export type ProjectQuality = {
  score: number; // 0-100
  missing: string[];
  questions: string[];
  budgetInsight: string | null;
  summary: string | null;
  checkedAt: string;
  source: "ai" | "rules";
};

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    status: projectStatus("status").notNull().default("draft"),
    budgetType: budgetType("budget_type").notNull().default("fixed"),
    budgetMin: integer("budget_min"),
    budgetMax: integer("budget_max"),
    estimatedHours: integer("estimated_hours"),
    workMode: workMode("work_mode").notNull().default("remote"),
    localityId: integer("locality_id").references(() => localities.id),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    geo: geoPoint(),
    radiusKm: integer("radius_km").notNull().default(50),
    invoice: invoiceRequirement("invoice").notNull().default("preferred"),
    urgency: urgency("urgency").notNull().default("flexible"),
    startDate: timestamp("start_date", { withTimezone: true, mode: "date" }),
    durationText: text("duration_text"),
    attributes: jsonb("attributes").$type<Record<string, string | number | boolean>>().notNull().default({}),
    maxApplications: integer("max_applications").notNull().default(5),
    maxAutoApplications: integer("max_auto_applications").notNull().default(2),
    allowAutoBids: boolean("allow_auto_bids").notNull().default(true),
    applicationsCount: integer("applications_count").notNull().default(0),
    autoApplicationsCount: integer("auto_applications_count").notNull().default(0),
    viewsCount: integer("views_count").notNull().default(0),
    quality: jsonb("quality").$type<ProjectQuality>(),
    aiSummary: text("ai_summary"),
    shareText: text("share_text"),
    source: projectSource("source").notNull().default("web"),
    sourceText: text("source_text"),
    moderationNote: text("moderation_note"),
    /** Pus în verificare din cauza raportărilor: doar un administrator îl poate debloca (clientul nu-l poate retrimite). */
    moderationLock: boolean("moderation_lock").notNull().default(false),
    contentHash: text("content_hash"),
    searchText: text("search_text").notNull().default(""),
    searchVector: tsvector("search_vector").generatedAlwaysAs(sql`to_tsvector('simple', search_text)`),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    autoBidOpensAt: timestamp("auto_bid_opens_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("projects_status_published_idx").on(t.status, t.publishedAt),
    index("projects_client_idx").on(t.clientId),
    index("projects_category_idx").on(t.categoryId),
    index("projects_geo_idx").using("gist", t.geo),
    index("projects_search_idx").using("gin", t.searchVector),
    index("projects_content_hash_idx").on(t.contentHash),
  ],
);

export const projectSkills = pgTable(
  "project_skills",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.skillId] }), index("project_skills_skill_idx").on(t.skillId)],
);

export const projectStatusHistory = pgTable(
  "project_status_history",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    fromStatus: projectStatus("from_status"),
    toStatus: projectStatus("to_status").notNull(),
    actorId: uuid("actor_id"),
    reason: text("reason"),
    createdAt: createdAt(),
  },
  (t) => [index("project_status_history_project_idx").on(t.projectId)],
);

export const savedProjects = pgTable(
  "saved_projects",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.projectId] })],
);

/* -------------------------------------------------------------------------- */
/*                                  Matching                                  */
/* -------------------------------------------------------------------------- */

export type MatchReason = { label: string; points: number; positive: boolean };

export const projectMatches = pgTable(
  "project_matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    reasons: jsonb("reasons").$type<MatchReason[]>().notNull().default([]),
    distanceKm: doublePrecision("distance_km"),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    digestedAt: timestamp("digested_at", { withTimezone: true }),
    seenAt: timestamp("seen_at", { withTimezone: true }),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("project_matches_uq").on(t.projectId, t.providerId),
    index("project_matches_provider_idx").on(t.providerId, t.createdAt),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                Applications                                */
/* -------------------------------------------------------------------------- */

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: applicationStatus("status").notNull().default("submitted"),
    message: text("message").notNull(),
    priceAmount: integer("price_amount"),
    priceType: priceType("price_type").notNull().default("fixed"),
    estimatedDays: integer("estimated_days"),
    isAuto: boolean("is_auto").notNull().default(false),
    autoRuleId: uuid("auto_rule_id"),
    boostedAt: timestamp("boosted_at", { withTimezone: true }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    clientNote: text("client_note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("applications_project_provider_uq").on(t.projectId, t.providerId),
    index("applications_provider_idx").on(t.providerId, t.createdAt),
    index("applications_project_idx").on(t.projectId, t.createdAt),
  ],
);

export const applicationEvents = pgTable(
  "application_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    actorId: uuid("actor_id"),
    data: jsonb("data").$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [index("application_events_app_idx").on(t.applicationId)],
);

/* -------------------------------------------------------------------------- */
/*                                   Billing                                  */
/* -------------------------------------------------------------------------- */

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: text("plan_id").notNull(),
    status: subscriptionStatus("status").notNull().default("incomplete"),
    /** null = plan oferit de echipă (recomandare, beta), fără plată. */
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("subscriptions_stripe_uq").on(t.stripeSubscriptionId),
    index("subscriptions_user_idx").on(t.userId),
  ],
);

export const stripeEvents = pgTable("stripe_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  error: text("error"),
  createdAt: createdAt(),
});

/* -------------------------------------------------------------------------- */
/*                                 Automation                                 */
/* -------------------------------------------------------------------------- */

export const autoBidRules = pgTable(
  "auto_bid_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    mode: autoBidMode("mode").notNull().default("review"),
    categoryIds: integer("category_ids").array().notNull().default(sql`ARRAY[]::integer[]`),
    keywords: text("keywords").array().notNull().default(sql`ARRAY[]::text[]`),
    excludeKeywords: text("exclude_keywords").array().notNull().default(sql`ARRAY[]::text[]`),
    minScore: integer("min_score").notNull().default(80),
    minBudget: integer("min_budget"),
    maxBudget: integer("max_budget"),
    workModes: text("work_modes").array().notNull().default(sql`ARRAY['remote','on_site','hybrid']::text[]`),
    maxDistanceKm: integer("max_distance_km"),
    requireVerifiedClient: boolean("require_verified_client").notNull().default(true),
    dailyCap: integer("daily_cap").notNull().default(3),
    template: text("template").notNull(),
    priceAmount: integer("price_amount"),
    priceType: priceType("price_type").notNull().default("to_discuss"),
    estimatedDays: integer("estimated_days"),
    personalizeWithAi: boolean("personalize_with_ai").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("auto_bid_rules_provider_idx").on(t.providerId)],
);

export const autoBidExecutions = pgTable(
  "auto_bid_executions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ruleId: uuid("rule_id")
      .notNull()
      .references(() => autoBidRules.id, { onDelete: "cascade" }),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    status: autoBidExecutionStatus("status").notNull(),
    reason: text("reason"),
    draftMessage: text("draft_message"),
    applicationId: uuid("application_id"),
    score: integer("score"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("auto_bid_executions_uq").on(t.providerId, t.projectId),
    index("auto_bid_executions_provider_idx").on(t.providerId, t.createdAt),
  ],
);

export const notificationPreferences = pgTable("notification_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  matchFrequency: digestFrequency("match_frequency").notNull().default("instant"),
  messagesEmail: boolean("messages_email").notNull().default(true),
  applicationUpdatesEmail: boolean("application_updates_email").notNull().default(true),
  autoBidEmail: boolean("auto_bid_email").notNull().default(true),
  productEmail: boolean("product_email").notNull().default(false),
  minMatchScore: integer("min_match_score").notNull().default(60),
  updatedAt: updatedAt(),
});

export const savedSearches = pgTable("saved_searches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // projects | providers
  name: text("name").notNull(),
  query: jsonb("query").$type<Record<string, unknown>>().notNull(),
  alert: boolean("alert").notNull().default(false),
  createdAt: createdAt(),
});

/* -------------------------------------------------------------------------- */
/*                                Communication                               */
/* -------------------------------------------------------------------------- */

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    lastMessagePreview: text("last_message_preview"),
    clientLastReadAt: timestamp("client_last_read_at", { withTimezone: true }),
    providerLastReadAt: timestamp("provider_last_read_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("conversations_application_uq").on(t.applicationId),
    index("conversations_client_idx").on(t.clientId, t.lastMessageAt),
    index("conversations_provider_idx").on(t.providerId, t.lastMessageAt),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id").references(() => users.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    isSystem: boolean("is_system").notNull().default(false),
    attachmentPath: text("attachment_path"),
    attachmentName: text("attachment_name"),
    attachmentSize: integer("attachment_size"),
    attachmentType: text("attachment_type"),
    flagged: boolean("flagged").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("messages_conversation_idx").on(t.conversationId, t.createdAt)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    data: jsonb("data").$type<Record<string, unknown>>(),
    dedupeKey: text("dedupe_key"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("notifications_user_idx").on(t.userId, t.createdAt),
    uniqueIndex("notifications_dedupe_uq").on(t.dedupeKey),
  ],
);

export const emailLog = pgTable(
  "email_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id"),
    to: text("to").notNull(),
    subject: text("subject").notNull(),
    template: text("template").notNull(),
    html: text("html").notNull(),
    /** Varianta text a emailului (trimisă alături de HTML). */
    text: text("text"),
    /**
     * Emailurile cu linkuri secrete (resetare parolă, confirmare email): `html`/`text` de mai sus sunt păstrate cu
     * tokenurile ascunse (`token=[ascuns]`), iar conținutul real stă aici, criptat (AES-256-GCM cu APP_SECRET),
     * doar până la livrare. Vezi `src/server/email/send.ts`.
     */
    secret: text("secret"),
    status: emailStatus("status").notNull().default("queued"),
    providerMessageId: text("provider_message_id"),
    error: text("error"),
    dedupeKey: text("dedupe_key"),
    createdAt: createdAt(),
  },
  (t) => [index("email_log_created_idx").on(t.createdAt), uniqueIndex("email_log_dedupe_uq").on(t.dedupeKey)],
);

/* -------------------------------------------------------------------------- */
/*                                    Trust                                   */
/* -------------------------------------------------------------------------- */

export const collaborations = pgTable(
  "collaborations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: collaborationStatus("status").notNull().default("pending_confirmation"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("collaborations_application_uq").on(t.applicationId),
    // Cel mult o colaborare neanulată per proiect (protejează alegerea prestatorului de dubluri la cereri simultane).
    uniqueIndex("collaborations_project_active_uq").on(t.projectId).where(sql`${t.status} <> 'cancelled'`),
    index("collaborations_provider_idx").on(t.providerId),
    index("collaborations_client_idx").on(t.clientId),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collaborationId: uuid("collaboration_id")
      .notNull()
      .references(() => collaborations.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetId: uuid("target_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull().default(""),
    hideAuthor: boolean("hide_author").notNull().default(false),
    reply: text("reply"),
    hiddenByAdmin: boolean("hidden_by_admin").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("reviews_collab_author_uq").on(t.collaborationId, t.authorId),
    index("reviews_target_idx").on(t.targetId, t.createdAt),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "set null" }),
    targetType: reportTarget("target_type").notNull(),
    targetId: text("target_id").notNull(),
    reason: reportReason("reason").notNull(),
    details: text("details").notNull().default(""),
    status: reportStatus("status").notNull().default("open"),
    resolvedById: uuid("resolved_by_id"),
    resolution: text("resolution"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("reports_status_idx").on(t.status, t.createdAt), index("reports_target_idx").on(t.targetType, t.targetId)],
);

export const moderationActions = pgTable(
  "moderation_actions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    adminId: uuid("admin_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [index("moderation_actions_target_idx").on(t.targetType, t.targetId)],
);

/* -------------------------------------------------------------------------- */
/*                                  Analytics                                 */
/* -------------------------------------------------------------------------- */

export const events = pgTable(
  "events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: uuid("user_id"),
    name: text("name").notNull(),
    props: jsonb("props").$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [index("events_name_created_idx").on(t.name, t.createdAt)],
);

export const aiUsage = pgTable(
  "ai_usage",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: uuid("user_id"),
    feature: text("feature").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    ok: boolean("ok").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index("ai_usage_feature_created_idx").on(t.feature, t.createdAt), index("ai_usage_user_idx").on(t.userId, t.createdAt)],
);

/* -------------------------------------------------------------------------- */
/*                              Outreach (Facebook)                           */
/* -------------------------------------------------------------------------- */

/** Postări/comentarii din grupuri de Facebook trimise de extensia copilot (docs/OUTREACH.md). */
export const outreachLeads = pgTable(
  "outreach_leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fbItemId: text("fb_item_id").notNull(), // post:<id> | comment:<id>
    kind: outreachKind("kind").notNull(),
    parentPostId: text("parent_post_id"),
    groupId: text("group_id").notNull(),
    groupName: text("group_name"),
    authorName: text("author_name"),
    authorProfileUrl: text("author_profile_url"),
    authorFbId: text("author_fb_id"),
    personKey: text("person_key"), // id:<fbId> | u:<username>
    text: text("text").notNull().default(""),
    permalink: text("permalink"),
    postedAtText: text("posted_at_text"),
    commentCount: integer("comment_count"),
    status: outreachStatus("status").notNull().default("new"),
    type: outreachType("type"),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    locality: text("locality"),
    score: integer("score"),
    reason: text("reason"),
    message: text("message"),
    contactedAt: timestamp("contacted_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("outreach_leads_fb_item_uq").on(t.fbItemId),
    index("outreach_leads_person_idx").on(t.personKey),
    index("outreach_leads_status_score_idx").on(t.status, t.score),
    index("outreach_leads_contacted_idx").on(t.contactedAt),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export type User = typeof users.$inferSelect;
export type ProviderProfile = typeof providerProfiles.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Locality = typeof localities.$inferSelect;
export type AutoBidRule = typeof autoBidRules.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type OutreachLead = typeof outreachLeads.$inferSelect;
