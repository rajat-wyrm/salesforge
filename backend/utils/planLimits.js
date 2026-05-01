// Plan-based limits for a real SaaS. Tweak in one place to change the whole product.
const PLAN_LIMITS = {
  FREE: {
    leads: 100,
    searches: 50,
    teamMembers: 1,
    apiKeys: 1,
    webhooks: 1,
    savedSearches: 5,
    tags: 10,
    exportsPerMonth: 5,
  },
  STARTER: {
    leads: 1000,
    searches: 500,
    teamMembers: 5,
    apiKeys: 5,
    webhooks: 5,
    savedSearches: 25,
    tags: 50,
    exportsPerMonth: 50,
  },
  PRO: {
    leads: 10000,
    searches: 5000,
    teamMembers: 25,
    apiKeys: 25,
    webhooks: 25,
    savedSearches: 100,
    tags: 200,
    exportsPerMonth: 500,
  },
  ENTERPRISE: {
    leads: Infinity,
    searches: Infinity,
    teamMembers: Infinity,
    apiKeys: Infinity,
    webhooks: Infinity,
    savedSearches: Infinity,
    tags: Infinity,
    exportsPerMonth: Infinity,
  },
};

const getPlan = (plan) => PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;

const checkLimit = (plan, resource, current) => {
  const limit = getPlan(plan)[resource];
  if (limit === undefined) return { allowed: true, limit: null };
  return { allowed: current < limit, limit, current };
};

const currentPeriod = () => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

module.exports = { PLAN_LIMITS, getPlan, checkLimit, currentPeriod };
