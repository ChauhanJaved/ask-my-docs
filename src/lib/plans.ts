export type PlanId = 'free' | 'starter' | 'pro' | 'business';
export type BillingInterval = 'monthly' | 'yearly';

export type QuotaKey = 'monthly_messages' | 'max_documents' | 'max_widgets' | 'team_seats';
export type FeatureKey = 'human_handoff' | 'remove_branding' | 'website_crawler' | 'analytics_export';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  badge?: string;
  description: string;
  priceMonthly: number;
  priceYearly: number; // Discounted total annual price
  quotas: Record<QuotaKey, number>; // -1 indicates unlimited
  features: Record<FeatureKey, boolean>;
  featureHighlights: string[];
}

export const FASTSPRING_STOREFRONT_URL = "https://frameworkteam.onfastspring.com";

export const FASTSPRING_PRODUCT_MAP: Record<string, { planId: PlanId; interval: BillingInterval }> = {
  'ftchat-starter-monthly': { planId: 'starter', interval: 'monthly' },
  'ftchat-starter-yearly':  { planId: 'starter', interval: 'yearly' },
  'ftchat-pro-monthly':      { planId: 'pro', interval: 'monthly' },
  'ftchat-pro-yearly':      { planId: 'pro', interval: 'yearly' },
  'ftchat-business-monthly': { planId: 'business', interval: 'monthly' },
  'ftchat-business-yearly':  { planId: 'business', interval: 'yearly' },
};

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free Trial',
    description: 'Perfect for testing and setting up your AI assistant.',
    priceMonthly: 0,
    priceYearly: 0,
    quotas: {
      monthly_messages: 100,
      max_documents: 2,
      max_widgets: 1,
      team_seats: 1,
    },
    features: {
      human_handoff: false,
      remove_branding: false,
      website_crawler: false,
      analytics_export: false,
    },
    featureHighlights: [
      '100 AI Messages / month',
      '2 Uploaded Documents',
      '1 Widget & 1 Team Seat',
      'FTChat Branding on widget',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'For small websites needing automated AI support.',
    priceMonthly: 29,
    priceYearly: 290, // $24.16/mo (save $58/yr)
    quotas: {
      monthly_messages: 2000,
      max_documents: 10,
      max_widgets: 1,
      team_seats: 2,
    },
    features: {
      human_handoff: false,
      remove_branding: false,
      website_crawler: false,
      analytics_export: true,
    },
    featureHighlights: [
      '2,000 AI Messages / month',
      '10 Uploaded Documents',
      '1 Widget & 2 Team Seats',
      'Basic Usage Analytics',
      'Standard AI Response Speed',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    badge: 'Most Popular',
    description: 'For growing businesses wanting web crawling and live handoff.',
    priceMonthly: 79,
    priceYearly: 790, // $65.83/mo (save $158/yr)
    quotas: {
      monthly_messages: 10000,
      max_documents: 50,
      max_widgets: 3,
      team_seats: 5,
    },
    features: {
      human_handoff: true,
      remove_branding: true,
      website_crawler: true,
      analytics_export: true,
    },
    featureHighlights: [
      '10,000 AI Messages / month',
      '50 Documents or Website Crawler',
      '3 Widgets & 5 Team Seats',
      'Human Handoff & Escalation',
      'Remove "Powered by FTChat"',
      'Unanswered Question Insights',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    description: 'For high-volume operations and large teams.',
    priceMonthly: 249,
    priceYearly: 2490, // $207.50/mo (save $498/yr)
    quotas: {
      monthly_messages: 40000,
      max_documents: -1, // Unlimited
      max_widgets: -1,   // Unlimited
      team_seats: 15,
    },
    features: {
      human_handoff: true,
      remove_branding: true,
      website_crawler: true,
      analytics_export: true,
    },
    featureHighlights: [
      '40,000 AI Messages / month',
      'Unlimited Documents & Crawler',
      'Unlimited Widgets & 15 Team Seats',
      'Human Handoff & Escalation',
      'White-label Widget Branding',
      'Priority Support & Custom Tuning',
    ],
  },
};

/**
 * Gets the standard PlanDefinition for a given plan ID, defaulting to 'free'.
 */
export function getPlanDefinition(planId?: string | null): PlanDefinition {
  const normalizedId = (planId?.toLowerCase() || 'free') as PlanId;
  return PLAN_DEFINITIONS[normalizedId] || PLAN_DEFINITIONS.free;
}

/**
 * Resolves effective quotas and features by merging custom_entitlements over plan defaults.
 */
export function getOrgEntitlements(
  planId?: string | null,
  customEntitlements?: Record<string, unknown> | null
) {
  const basePlan = getPlanDefinition(planId);
  const customQuotas = (customEntitlements?.quotas as Record<string, number>) || {};
  const customFeatures = (customEntitlements?.features as Record<string, boolean>) || {};

  return {
    plan: basePlan,
    quotas: { ...basePlan.quotas, ...customQuotas } as Record<QuotaKey, number>,
    features: { ...basePlan.features, ...customFeatures } as Record<FeatureKey, boolean>,
  };
}

/**
 * Checks if a specific feature boolean is enabled for an organization.
 */
export function isFeatureEnabled(
  planId: string | undefined | null,
  feature: FeatureKey,
  customEntitlements?: Record<string, unknown> | null
): boolean {
  const entitlements = getOrgEntitlements(planId, customEntitlements);
  return !!entitlements.features[feature];
}

/**
 * Checks if a usage limit is exceeded. Returns true if exceeded.
 */
export function isQuotaExceeded(
  planId: string | undefined | null,
  quota: QuotaKey,
  currentUsage: number,
  customEntitlements?: Record<string, unknown> | null
): boolean {
  const entitlements = getOrgEntitlements(planId, customEntitlements);
  const limit = entitlements.quotas[quota];

  // -1 means unlimited
  if (limit === -1) return false;
  return currentUsage >= limit;
}

export const PLAN_RANKS: Record<PlanId, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  business: 3,
};

/**
 * Returns numerical rank of a plan to determine upgrade vs downgrade.
 */
export function getPlanRank(planId?: string | null): number {
  const normalizedId = (planId?.toLowerCase() || 'free') as PlanId;
  return PLAN_RANKS[normalizedId] ?? 0;
}

/**
 * Checks if target plan is a downgrade from current plan.
 */
export function isPlanDowngrade(currentPlanId: string | undefined | null, targetPlanId: PlanId): boolean {
  return getPlanRank(targetPlanId) < getPlanRank(currentPlanId);
}

