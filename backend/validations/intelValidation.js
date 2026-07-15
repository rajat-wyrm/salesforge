const Joi = require("joi");

const searchIntelSchema = Joi.object({
  module: Joi.string().required().valid(
    "email_intelligence",
    "domain_intelligence",
    "company_intelligence",
    "person_search",
    "social_media_search",
    "username_search",
    "phone_lookup",
    "ip_lookup",
    "whois_lookup",
    "dns_lookup",
    "ssl_lookup",
    "reverse_dns",
    "reverse_ip",
    "tech_stack_detection",
    "email_verification",
    "disposable_email_detection",
    "mx_spf_dkim_dmarc",
    "company_employees",
    "decision_makers",
    "lead_enrichment",
    "company_funding",
    "competitor_analysis",
    "news_search",
    "public_documents",
    "job_listings",
    "similar_companies",
    "crm_duplicate_finder"
  ),
  query: Joi.string().required().min(1).max(500),
  filters: Joi.object({
    location: Joi.string().allow("", null).max(120).optional(),
    minEmployees: Joi.number().integer().min(0).allow("", null).optional(),
    industry: Joi.string().allow("", null).max(120).optional(),
    exactMatch: Joi.boolean().optional()
  }).optional()
});

const getHistorySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  module: Joi.string().optional()
});

const togglePinSchema = Joi.object({
  id: Joi.number().integer().required()
});

const deleteHistorySchema = Joi.object({
  id: Joi.number().integer().required()
});

const createSavedSearchSchema = Joi.object({
  name: Joi.string().required().min(1).max(200),
  module: Joi.string().required().valid(
    "email_intelligence",
    "domain_intelligence",
    "company_intelligence",
    "person_search",
    "social_media_search",
    "username_search",
    "phone_lookup",
    "ip_lookup",
    "whois_lookup",
    "dns_lookup",
    "ssl_lookup",
    "reverse_dns",
    "reverse_ip",
    "tech_stack_detection",
    "email_verification",
    "disposable_email_detection",
    "mx_spf_dkim_dmarc",
    "company_employees",
    "decision_makers",
    "lead_enrichment",
    "company_funding",
    "competitor_analysis",
    "news_search",
    "public_documents",
    "job_listings",
    "similar_companies",
    "crm_duplicate_finder"
  ),
  filters: Joi.object({
    location: Joi.string().allow("", null).max(120).optional(),
    minEmployees: Joi.number().integer().min(0).allow("", null).optional(),
    industry: Joi.string().allow("", null).max(120).optional(),
    exactMatch: Joi.boolean().optional()
  }).optional()
});

module.exports = {
  searchIntelSchema,
  getHistorySchema,
  togglePinSchema,
  deleteHistorySchema,
  createSavedSearchSchema
};
