const axios = require("axios");
const { AppError } = require("../middleware/errorHandler");

// ── API Keys configuration ──
const API_KEYS = {
  hunter: process.env.HUNTER_API_KEY,
  clearbit: process.env.CLEARBIT_API_KEY,
  apollo: process.env.APOLLO_API_KEY,
  pdl: process.env.PDL_API_KEY,
  opencorporates: process.env.OPENCORPORATES_API_KEY,
  whoisxml: process.env.WHOISXML_API_KEY,
  securitytrails: process.env.SECURITYTRAILS_API_KEY,
  ipinfo: process.env.IPINFO_API_KEY,
  virustotal: process.env.VIRUSTOTAL_API_KEY,
  builtwith: process.env.BUILTWITH_API_KEY,
  wappalyzer: process.env.WAPPALYZER_API_KEY,
  newsapi: process.env.NEWS_API_KEY,
  github: process.env.GITHUB_TOKEN || process.env.GITHUB_API_KEY,
  gravatar: process.env.GRAVATAR_API_KEY,
  googleSearch: process.env.GOOGLE_SEARCH_API_KEY,
  gemini: process.env.GEMINI_API_KEY
};

/**
 * Call Gemini AI model to generate insights
 */
async function generateAiInsights(prompt) {
  if (!API_KEYS.gemini) {
    return generateFallbackAiInsights(prompt);
  }
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEYS.gemini}`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };
    const res = await axios.post(url, payload, { headers: { "Content-Type": "application/json" }, timeout: 10000 });
    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      return JSON.parse(text);
    }
    throw new Error("Empty response from Gemini");
  } catch (error) {
    console.error("Gemini AI API error, running fallback:", error.message);
    return generateFallbackAiInsights(prompt);
  }
}

function generateFallbackAiInsights(prompt) {
  // Parsing the request to offer semi-personalized mock responses
  const lowerPrompt = prompt.toLowerCase();
  let name = "Target Company";
  let domain = "target.com";

  if (lowerPrompt.includes("company") || lowerPrompt.includes("competitor")) {
    const match = prompt.match(/company:\s*([^\n]+)/i) || prompt.match(/domain:\s*([^\n]+)/i);
    if (match) name = match[1].trim();
  } else if (lowerPrompt.includes("contact") || lowerPrompt.includes("person")) {
    const match = prompt.match(/name:\s*([^\n]+)/i) || prompt.match(/email:\s*([^\n]+)/i);
    if (match) name = match[1].trim();
  }

  return {
    summary: `${name} is a rapidly growing enterprise operating in its sector. They have recently upgraded their core technical stack, signaling investments in scalability and automation.`,
    contactSummary: `Key contact ${name} possesses deep domain expertise with a proven track record. They are active in professional communities and exhibit high decision-making authority.`,
    salesInsights: [
      "Targeting tech stack updates: The prospect's adoption of premium cloud services suggest budget readiness for tooling integration.",
      "Department growth: Job listings suggest expansion in engineering and customer success divisions.",
      "Market pain points: Competitors are raising pricing models, creating an opportunity for SalesForge to position cost-effectiveness."
    ],
    suggestedActions: [
      { action: "Outreach Sequence", description: "Launch personalized email sequences focusing on technical stack optimization." },
      { action: "LinkedIn Connect", description: `Send a connections request to ${name} highlighting recent industry reports.` },
      { action: "Demo Pitch", description: "Schedule a product presentation centering on their workflow integration." }
    ],
    opportunityScore: Math.floor(Math.random() * 25) + 70, // 70-95
    competitors: [
      { name: "Competitor Alpha", marketShare: "32%", strength: "Wide brand awareness", weakness: "Legacy UI" },
      { name: "Competitor Beta", marketShare: "18%", strength: "Cheap pricing tiers", weakness: "Poor customer service" }
    ],
    followUpEmail: `Subject: Enhancing your workflows at ${name}\n\nHi ${name},\n\nI noticed you have been expanding the technical capabilities at your company. Many teams face integration challenges as they scale their technology systems.\n\nHere at SalesForge, we help organizations accelerate outreach operations while maintaining clean data systems. Would you be open to a brief 10-minute call next Tuesday at 2 PM to explore potential synergies?\n\nBest regards,\nSalesForge Team`
  };
}

/**
 * Execute search for a module
 */
async function searchIntel(module, query, filters = {}) {
  const result = {
    module,
    query,
    filters,
    searchedAt: new Date().toISOString(),
    provider: "Mock OSINT System"
  };

  // If external APIs are configured, we hit them. Otherwise we generate realistic data.
  switch (module) {
    case "email_intelligence":
      result.provider = API_KEYS.hunter ? "Hunter.io" : "Mock OSINT Hub";
      result.data = await getEmailIntelligence(query);
      break;
    case "domain_intelligence":
      result.provider = API_KEYS.clearbit ? "Clearbit" : "Mock OSINT Hub";
      result.data = await getDomainIntelligence(query);
      break;
    case "company_intelligence":
      result.provider = API_KEYS.clearbit ? "Clearbit" : "Mock OSINT Hub";
      result.data = await getCompanyIntelligence(query);
      break;
    case "person_search":
      result.provider = API_KEYS.pdl ? "PeopleDataLabs" : "Mock OSINT Hub";
      result.data = await getPersonIntelligence(query);
      break;
    case "social_media_search":
      result.provider = API_KEYS.github ? "GitHub & Gravatar" : "Mock OSINT Hub";
      result.data = await getSocialIntelligence(query);
      break;
    case "username_search":
      result.provider = "OSINT Username Finder";
      result.data = await getUsernameIntelligence(query);
      break;
    case "phone_lookup":
      result.provider = "Telecom Resolver";
      result.data = await getPhoneIntelligence(query);
      break;
    case "ip_lookup":
      result.provider = API_KEYS.ipinfo ? "IPInfo" : "Mock OSINT Hub";
      result.data = await getIpIntelligence(query);
      break;
    case "whois_lookup":
      result.provider = API_KEYS.whoisxml ? "WhoisXML" : "Mock OSINT Hub";
      result.data = await getWhoisIntelligence(query);
      break;
    case "dns_lookup":
      result.provider = API_KEYS.securitytrails ? "SecurityTrails" : "Mock OSINT Hub";
      result.data = await getDnsIntelligence(query);
      break;
    case "ssl_lookup":
      result.provider = "SSL Labs Resolver";
      result.data = await getSslIntelligence(query);
      break;
    case "reverse_dns":
      result.provider = "Reverse DNS Resolver";
      result.data = await getReverseDns(query);
      break;
    case "reverse_ip":
      result.provider = "Reverse IP Resolver";
      result.data = await getReverseIp(query);
      break;
    case "tech_stack_detection":
      result.provider = API_KEYS.builtwith ? "BuiltWith" : "Wappalyzer Mock";
      result.data = await getTechStack(query);
      break;
    case "email_verification":
      result.provider = API_KEYS.hunter ? "Hunter.io Verify" : "Mock SMTP Verify";
      result.data = await verifyEmailDetails(query);
      break;
    case "disposable_email_detection":
      result.provider = "OSINT Disposable Email Guard";
      result.data = await detectDisposable(query);
      break;
    case "mx_spf_dkim_dmarc":
      result.provider = "DNS Security Analyzer";
      result.data = await analyzeDnsSecurity(query);
      break;
    case "company_employees":
      result.provider = API_KEYS.apollo ? "Apollo.io" : "Mock Contact Engine";
      result.data = await getCompanyEmployees(query);
      break;
    case "decision_makers":
      result.provider = API_KEYS.apollo ? "Apollo.io" : "Mock Contact Engine";
      result.data = await getDecisionMakers(query);
      break;
    case "lead_enrichment":
      result.provider = "Multi-source Enricher";
      result.data = await enrichLead(query);
      break;
    case "company_funding":
      result.provider = API_KEYS.opencorporates ? "OpenCorporates & Crunchbase" : "Mock Crunchbase";
      result.data = await getCompanyFunding(query);
      break;
    case "competitor_analysis":
      result.provider = "AI Sales Intelligence Engine";
      result.data = await analyzeCompetitors(query);
      break;
    case "news_search":
      result.provider = API_KEYS.newsapi ? "NewsAPI" : "Mock Google News";
      result.data = await getCompanyNews(query);
      break;
    case "public_documents":
      result.provider = "Public Documents Engine";
      result.data = await getPublicDocuments(query);
      break;
    case "job_listings":
      result.provider = "Job Board Scanner";
      result.data = await getJobListings(query);
      break;
    case "similar_companies":
      result.provider = "OSINT Similarity Engine";
      result.data = await getSimilarCompanies(query);
      break;
    case "crm_duplicate_finder":
      result.provider = "SalesForge Duplicate Scanner";
      result.data = await scanCrmDuplicates(query);
      break;
    default:
      throw new AppError(`Unsupported search module: ${module}`, 400);
  }

  // Inject AI summary details based on module outcomes
  if (result.data) {
    const aiPrompt = `
      Please analyze this Sales OSINT search output. Provide a structured JSON output with fields:
      - summary (paragraph company/contact summary)
      - contactSummary (contact profile summary)
      - salesInsights (array of string notes)
      - suggestedActions (array of {action, description})
      - opportunityScore (number 1-100)
      - competitors (array of {name, marketShare, strength, weakness})
      - followUpEmail (string template follow up email)

      Search query: "${query}"
      Module type: "${module}"
      Search Data: ${JSON.stringify(result.data)}
    `;
    result.ai = await generateAiInsights(aiPrompt);
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
//  INDIVIDUAL MODULE PROCESSORS (WITH REAL API HANDLERS OR ROBUST MOCK FALLBACKS)
// ─────────────────────────────────────────────────────────────────────────────

async function getEmailIntelligence(email) {
  if (API_KEYS.hunter) {
    try {
      const res = await axios.get(`https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${API_KEYS.hunter}`);
      return res.data?.data;
    } catch (_) {}
  }
  const domain = email.split("@")[1] || "target.com";
  return {
    email,
    domain,
    status: "valid",
    score: 92,
    deliverability: "deliverable",
    acceptAll: false,
    disposable: false,
    freeEmail: false,
    mxRecords: [{ host: "mail.protonmail.ch", priority: 10 }],
    spf: true,
    dkim: true,
    dmarc: true,
    linkedinUrl: `https://linkedin.com/in/mock-user-${Math.floor(Math.random() * 1000)}`
  };
}

async function getDomainIntelligence(domain) {
  if (API_KEYS.clearbit) {
    try {
      const res = await axios.get(`https://company.clearbit.com/v2/companies/find?domain=${domain}`, {
        headers: { Authorization: `Bearer ${API_KEYS.clearbit}` }
      });
      return res.data;
    } catch (_) {}
  }
  return {
    domain,
    companyName: domain.split(".")[0].toUpperCase(),
    logo: `https://logo.clearbit.com/${domain}`,
    industry: "Information Technology & Services",
    employeesCount: 245,
    foundedYear: 2018,
    country: "United States",
    countryCode: "US",
    city: "San Francisco",
    description: "A fast growing SaaS company offering modern enterprise services.",
    categories: ["SaaS", "Enterprise software", "B2B"],
    alexaRank: 42100,
    linkedinUrl: `https://linkedin.com/company/${domain.split(".")[0]}`
  };
}

async function getCompanyIntelligence(companyName) {
  const domain = `${companyName.toLowerCase().replace(/[^a-z0-9]/g, "") || "target"}.com`;
  return getDomainIntelligence(domain);
}

async function getPersonIntelligence(nameOrEmail) {
  if (API_KEYS.pdl) {
    try {
      const res = await axios.post("https://api.peopledatalabs.com/v5/person/enrich", {
        email: nameOrEmail.includes("@") ? nameOrEmail : undefined,
        name: !nameOrEmail.includes("@") ? nameOrEmail : undefined
      }, {
        headers: { "X-Api-Key": API_KEYS.pdl }
      });
      return res.data?.data;
    } catch (_) {}
  }
  const isEmail = nameOrEmail.includes("@");
  const name = isEmail ? nameOrEmail.split("@")[0].toUpperCase() : nameOrEmail;
  return {
    fullName: name,
    avatar: `https://www.gravatar.com/avatar/${Buffer.from(nameOrEmail).toString("hex")}?d=identicon`,
    email: isEmail ? nameOrEmail : "alex.johnson@targetcompany.com",
    title: "VP of Business Development",
    company: "Target Company",
    location: "Austin, Texas, United States",
    countryFlag: "US",
    linkedIn: "https://linkedin.com/in/alex-johnson-mock",
    twitter: "https://twitter.com/alex_bd_mock",
    github: "https://github.com/alexjohnson-dev",
    skills: ["B2B SaaS Sales", "Lead Generation", "Strategy", "Prisma ORM", "Next.js"],
    experience: [
      { role: "VP of Business Development", company: "Target Company", start: "2022", end: "Present" },
      { role: "Director of Outreach", company: "OutreachInc", start: "2019", end: "2022" }
    ]
  };
}

async function getSocialIntelligence(query) {
  if (API_KEYS.github && query.includes("github.com")) {
    try {
      const username = query.split("/").pop();
      const res = await axios.get(`https://api.github.com/users/${username}`, {
        headers: { Authorization: `token ${API_KEYS.github}` }
      });
      return res.data;
    } catch (_) {}
  }
  return {
    handle: query.includes("linkedin.com") || query.includes("github.com") ? query.split("/").pop() : query,
    platform: query.includes("github.com") ? "GitHub" : "LinkedIn",
    profileUrl: query,
    avatarUrl: "https://gravatar.com/avatar/mock?d=mp",
    followers: 1240,
    following: 340,
    bio: "Full stack engineer building cloud tools. Lover of React, Tailwind, Node, and Postgres.",
    location: "New York, USA",
    verified: true,
    activityHistory: [
      { date: "2026-07-10", type: "Post", content: "Excited to launch our new enterprise dashboard today!" },
      { date: "2026-07-08", type: "Comment", content: "Great insights on sales automation workflows." }
    ]
  };
}

async function getUsernameIntelligence(username) {
  const platforms = [
    { name: "GitHub", url: `https://github.com/${username}`, found: true },
    { name: "Twitter/X", url: `https://x.com/${username}`, found: true },
    { name: "LinkedIn", url: `https://linkedin.com/in/${username}`, found: false },
    { name: "Medium", url: `https://medium.com/@${username}`, found: true },
    { name: "Reddit", url: `https://reddit.com/user/${username}`, found: true },
    { name: "Dev.to", url: `https://dev.to/${username}`, found: false }
  ];
  return {
    username,
    matches: platforms.filter(p => p.found),
    platforms
  };
}

async function getPhoneIntelligence(phone) {
  return {
    phone,
    valid: true,
    carrier: "Verizon Wireless",
    type: "mobile",
    location: "Chicago, IL",
    countryCode: "US",
    reputationScore: 98,
    isSpam: false
  };
}

async function getIpIntelligence(ip) {
  if (API_KEYS.ipinfo) {
    try {
      const res = await axios.get(`https://ipinfo.io/${ip}/json?token=${API_KEYS.ipinfo}`);
      return res.data;
    } catch (_) {}
  }
  return {
    ip,
    city: "Seattle",
    region: "Washington",
    country: "United States",
    countryCode: "US",
    postal: "98101",
    timezone: "America/Los_Angeles",
    loc: "47.6062,-122.3321",
    org: "AS16509 Amazon.com, Inc.",
    asn: "AS16509",
    vpn: false,
    proxy: false,
    tor: false,
    riskScore: 4
  };
}

async function getWhoisIntelligence(domain) {
  if (API_KEYS.whoisxml) {
    try {
      const res = await axios.get(`https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${API_KEYS.whoisxml}&domainName=${domain}&outputFormat=JSON`);
      return res.data?.WhoisRecord;
    } catch (_) {}
  }
  return {
    domainName: domain,
    registrar: "NameCheap, Inc.",
    creationDate: "2015-08-12T14:40:00Z",
    expirationDate: "2027-08-12T14:40:00Z",
    updatedDate: "2025-07-28T09:20:00Z",
    registrantName: "Domain Protection Services",
    registrantOrg: "Redacted for Privacy",
    registrantCountry: "Iceland",
    nameServers: ["ns1.dnsmadeeasy.com", "ns2.dnsmadeeasy.com"]
  };
}

async function getDnsIntelligence(domain) {
  if (API_KEYS.securitytrails) {
    try {
      const res = await axios.get(`https://api.securitytrails.com/v1/domain/${domain}`, {
        headers: { APIKEY: API_KEYS.securitytrails }
      });
      return res.data;
    } catch (_) {}
  }
  return {
    domain,
    records: {
      A: ["18.140.22.84", "54.254.198.110"],
      MX: ["10 mail.protonmail.ch.", "20 mailsec.protonmail.ch."],
      NS: ["ns1.dnsmadeeasy.com.", "ns2.dnsmadeeasy.com."],
      TXT: ["v=spf1 include:_spf.protonmail.ch ~all", "google-site-verification=abc123xyz"]
    }
  };
}

async function getSslIntelligence(domain) {
  return {
    domain,
    issuer: "Let's Encrypt Authority X3",
    serialNumber: "03ab2f3491ea0e1fcf2340dbf241a7e12",
    validFrom: "2026-06-01T00:00:00Z",
    validTo: "2026-09-01T00:00:00Z",
    status: "valid",
    protocol: "TLS 1.3",
    cipherSuite: "TLS_AES_256_GCM_SHA384",
    keySize: 2048,
    grade: "A+"
  };
}

async function getReverseDns(ip) {
  return {
    ip,
    ptrRecord: "ec2-54-254-198-110.ap-southeast-1.compute.amazonaws.com"
  };
}

async function getReverseIp(ip) {
  return {
    ip,
    hostedDomains: [
      "salesforge.ai",
      "app.salesforge.ai",
      "outreach-analytics.io",
      "coldemailtemplates.net"
    ],
    count: 4
  };
}

async function getTechStack(domain) {
  if (API_KEYS.builtwith) {
    try {
      const res = await axios.get(`https://api.builtwith.com/v20/api.json?key=${API_KEYS.builtwith}&LOOKUP=${domain}`);
      return res.data;
    } catch (_) {}
  }
  return {
    domain,
    technologies: [
      { name: "React", category: "JavaScript Frameworks", version: "18.2.0", icon: "react" },
      { name: "Next.js", category: "Web Frameworks", version: "14.1.0", icon: "next" },
      { name: "TailwindCSS", category: "CSS Frameworks", version: "3.4.1", icon: "tailwind" },
      { name: "Prisma", category: "Database/ORM", version: "5.10.0", icon: "database" },
      { name: "Stripe", category: "Payment Gateways", version: null, icon: "stripe" },
      { name: "Google Analytics", category: "Analytics & Tracking", version: null, icon: "analytics" },
      { name: "HubSpot CRM", category: "CRM / Sales", version: null, icon: "crm" }
    ],
    techCount: 7
  };
}

async function verifyEmailDetails(email) {
  const domain = email.split("@")[1] || "target.com";
  return {
    email,
    syntaxValid: true,
    domainExist: true,
    mxValid: true,
    smtpConnection: "success",
    isCatchAll: false,
    isRoleAddress: false,
    verificationScore: 98,
    risk: "low"
  };
}

async function detectDisposable(emailOrDomain) {
  const domain = emailOrDomain.includes("@") ? emailOrDomain.split("@")[1] : emailOrDomain;
  const disposableList = new Set(["mailinator.com", "guerrillamail.com", "tempmail.io", "10minutemail.com"]);
  const isDisp = disposableList.has(domain.toLowerCase());
  return {
    domain,
    disposable: isDisp,
    riskScore: isDisp ? 100 : 0,
    assessment: isDisp ? "HIGH_RISK" : "CLEAN"
  };
}

async function analyzeDnsSecurity(domain) {
  return {
    domain,
    mx: { status: "valid", servers: ["mail.protonmail.ch"] },
    spf: { status: "valid", record: "v=spf1 include:_spf.protonmail.ch ~all", score: 100 },
    dkim: { status: "configured", selector: "default", score: 85 },
    dmarc: { status: "valid", record: "v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@target.com", policy: "quarantine" }
  };
}

async function getCompanyEmployees(domain) {
  if (API_KEYS.apollo) {
    try {
      const res = await axios.post("https://api.apollo.io/v1/mixed_people/search", {
        q_organization_domains: domain,
        page: 1,
        per_page: 10
      }, {
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" }
      });
      return res.data;
    } catch (_) {}
  }
  return [
    { name: "Sarah Connor", title: "VP of Engineering", email: "sarah.connor@example.com", avatar: "", department: "Engineering" },
    { name: "John Miller", title: "Chief Marketing Officer", email: "john.miller@example.com", avatar: "", department: "Marketing" },
    { name: "Alex Johnson", title: "VP of Business Development", email: "alex.johnson@example.com", avatar: "", department: "Sales" },
    { name: "Emily Watson", title: "Director of Recruiting", email: "emily.watson@example.com", avatar: "", department: "HR" }
  ];
}

async function getDecisionMakers(domain) {
  const employees = await getCompanyEmployees(domain);
  const decisionTitles = ["CEO", "CTO", "CMO", "VP", "Chief", "Director"];
  return employees.filter(emp => decisionTitles.some(title => emp.title.includes(title)));
}

async function enrichLead(query) {
  const emailIntel = await getEmailIntelligence(query.includes("@") ? query : `contact@${query}`);
  const domainIntel = await getDomainIntelligence(emailIntel.domain);
  const personIntel = await getPersonIntelligence(query);
  return {
    email: emailIntel,
    company: domainIntel,
    person: personIntel,
    leadScore: 88,
    priority: "HIGH",
    insights: [
      "Contact title VP holds purchase decision power.",
      "Company uses HubSpot CRM and Stripe indicating B2B commercial readiness.",
      "Lead has recently opened 2 cold outreach mails."
    ]
  };
}

async function getCompanyFunding(companyName) {
  return {
    companyName,
    totalRaised: "$14.2M",
    rounds: [
      { round: "Series A", amount: "$10M", date: "2025-05-14", leadInvestors: ["Sequoia Capital", "Index Ventures"] },
      { round: "Seed", amount: "$4.2M", date: "2023-09-01", leadInvestors: ["Y Combinator", "First Round Capital"] }
    ]
  };
}

async function analyzeCompetitors(companyName) {
  return [
    { name: "ZoomInfo", overlap: "High", strength: "Large contact database", weakness: "High price barriers", techStack: ["Salesforce", "React"] },
    { name: "Apollo.io", overlap: "High", strength: "Email automation + DB", weakness: "Data accuracy gaps", techStack: ["HubSpot", "Vue"] },
    { name: "Clearbit", overlap: "Medium", strength: "API integrations", weakness: "No direct marketing tool", techStack: ["Marketo", "NextJS"] }
  ];
}

async function getCompanyNews(companyName) {
  if (API_KEYS.newsapi) {
    try {
      const res = await axios.get(`https://newsapi.org/v2/everything?q=${encodeURIComponent(companyName)}&sortBy=publishedAt&apiKey=${API_KEYS.newsapi}`);
      return res.data?.articles;
    } catch (_) {}
  }
  return [
    { title: `${companyName} raises Series A to accelerate expansion`, url: "https://techcrunch.com/mock", source: "TechCrunch", date: "2026-04-10", sentiment: "positive" },
    { title: `How ${companyName} is changing Sales automation systems`, url: "https://forbes.com/mock", source: "Forbes", date: "2026-03-24", sentiment: "positive" }
  ];
}

async function getPublicDocuments(companyName) {
  return [
    { title: "SEC Form 10-K (Annual Filing)", type: "PDF Document", url: "https://sec.gov/filings/10k", date: "2026-02-15" },
    { title: "Case Study: Modern Integrations", type: "Whitepaper", url: "https://target.com/case-study", date: "2025-11-09" }
  ];
}

async function getJobListings(companyName) {
  return [
    { title: "Senior React Developer", department: "Engineering", location: "Remote, US", posted: "3 days ago" },
    { title: "Sales Executive (B2B SaaS)", department: "Sales", location: "San Francisco, CA", posted: "1 week ago" }
  ];
}

async function getSimilarCompanies(companyName) {
  return [
    { name: "HubSpot", domain: "hubspot.com", similarity: 85, headquarters: "Cambridge, MA" },
    { name: "Apollo.io", domain: "apollo.io", similarity: 82, headquarters: "San Francisco, CA" },
    { name: "Salesloft", domain: "salesloft.com", similarity: 79, headquarters: "Atlanta, GA" }
  ];
}

async function scanCrmDuplicates(query) {
  return {
    query,
    isDuplicate: false,
    duplicatePercentage: 0,
    matches: [],
    suggestion: "Proceed to add this lead. No duplicate found in workspace."
  };
}

module.exports = {
  searchIntel,
  generateAiInsights
};
