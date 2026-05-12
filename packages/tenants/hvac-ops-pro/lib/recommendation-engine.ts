export type HvacPlatformId = "housecall-pro" | "jobber" | "servicetitan";

export type HvacQuizAnswers = {
  teamSize?: string | undefined;
  biggestHeadache?: string | undefined;
  usingSoftware?: string | undefined;
  currentSoftware?: string | undefined;
  monthlyRevenueRange?: string | undefined;
  firstName?: string | undefined;
  email?: string | undefined;
};

export type HvacRecommendation = {
  platformId: HvacPlatformId;
  platformName: string;
  reason: string;
  affiliateEnvVar: string;
  fallbackUrl: string;
};

export const hvacPlatforms: Record<HvacPlatformId, Omit<HvacRecommendation, "platformId" | "reason">> = {
  "housecall-pro": {
    platformName: "Housecall Pro",
    affiliateEnvVar: "HVAC_OPS_PRO_HOUSECALL_PRO_AFFILIATE_URL",
    fallbackUrl: "https://www.housecallpro.com/"
  },
  jobber: {
    platformName: "Jobber",
    affiliateEnvVar: "HVAC_OPS_PRO_JOBBER_AFFILIATE_URL",
    fallbackUrl: "https://getjobber.com/"
  },
  servicetitan: {
    platformName: "ServiceTitan",
    affiliateEnvVar: "HVAC_OPS_PRO_SERVICETITAN_AFFILIATE_URL",
    fallbackUrl: "https://www.servicetitan.com/"
  }
};

export function recommendHvacSoftware(answers: HvacQuizAnswers): HvacRecommendation {
  const teamSize = answers.teamSize ?? "";
  const headache = answers.biggestHeadache ?? "";
  const revenue = answers.monthlyRevenueRange ?? "";

  if (teamSize === "16+" || revenue === "$250k+" || (teamSize === "6-15" && headache === "dispatching")) {
    return withReason(
      "servicetitan",
      "You are running a larger operation, so the recommendation leans toward a full-stack platform with dispatch, reporting, and multi-team workflows."
    );
  }

  if (headache === "scheduling" || headache === "dispatching") {
    return withReason(
      "housecall-pro",
      "Your biggest drag is getting the right tech to the right job, so the recommendation favors scheduling and dispatch speed."
    );
  }

  if (teamSize === "1" || teamSize === "2-5" || headache === "invoicing") {
    return withReason(
      "jobber",
      "Your team needs clean job tracking, faster invoicing, and a lighter rollout without a heavy operations rebuild."
    );
  }

  return withReason(
    "housecall-pro",
    "Your answers point to an ops platform that can tighten scheduling, follow-up, and field communication without overcomplicating the shop."
  );
}

export function getHvacAffiliateUrl(platformId: HvacPlatformId): string {
  const platform = hvacPlatforms[platformId];
  return process.env[platform.affiliateEnvVar] ?? platform.fallbackUrl;
}

export function isHvacPlatformId(value: string): value is HvacPlatformId {
  return value === "housecall-pro" || value === "jobber" || value === "servicetitan";
}

function withReason(platformId: HvacPlatformId, reason: string): HvacRecommendation {
  const platform = hvacPlatforms[platformId];
  return {
    platformId,
    platformName: platform.platformName,
    affiliateEnvVar: platform.affiliateEnvVar,
    fallbackUrl: platform.fallbackUrl,
    reason
  };
}
