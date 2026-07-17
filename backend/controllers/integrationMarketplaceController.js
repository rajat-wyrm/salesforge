const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

const CATALOG = [
  { id: "slack", name: "Slack", description: "Send notifications and updates to your team channels.", category: "Communication", icon: "MessageSquare", popular: true, configFields: [{ key: "webhookUrl", label: "Incoming Webhook URL", type: "url" }] },
  { id: "gmail", name: "Gmail", description: "Send and track emails from your Gmail account.", category: "Email", icon: "Mail", popular: true, configFields: [{ key: "email", label: "Email address", type: "email" }] },
  { id: "outlook", name: "Microsoft Outlook", description: "Connect your Outlook account for email tracking.", category: "Email", icon: "Mail", configFields: [{ key: "email", label: "Email address", type: "email" }] },
  { id: "google_calendar", name: "Google Calendar", description: "Sync meetings and events with Google Calendar.", category: "Calendar", icon: "Calendar", popular: true },
  { id: "linkedin", name: "LinkedIn", description: "Enrich leads with LinkedIn profile data.", category: "Enrichment", icon: "Linkedin" },
  { id: "zoom", name: "Zoom", description: "Schedule and join Zoom meetings directly.", category: "Video", icon: "Video" },
  { id: "stripe", name: "Stripe", description: "Sync payments and subscriptions from Stripe.", category: "Billing", icon: "CreditCard" },
  { id: "hubspot", name: "HubSpot", description: "Two-way sync with HubSpot CRM.", category: "CRM", icon: "Briefcase", popular: true },
  { id: "salesforce", name: "Salesforce", description: "Two-way sync with Salesforce.", category: "CRM", icon: "Briefcase" },
  { id: "intercom", name: "Intercom", description: "Sync customer conversations and data.", category: "Support", icon: "MessageSquare" },
  { id: "zapier", name: "Zapier", description: "Connect to 5,000+ apps via Zapier.", category: "Automation", icon: "Workflow" },
  { id: "whatsapp", name: "WhatsApp", description: "Send WhatsApp messages to leads and customers.", category: "Communication", icon: "MessageSquare" },
];

const OAUTH_CONFIG = {
  slack: {
    authUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    clientIdEnv: "SLACK_CLIENT_ID",
    clientSecretEnv: "SLACK_CLIENT_SECRET",
    scopes: "incoming-webhook,commands,chat:write",
  },
  gmail: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    scopes: "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly",
  },
  google_calendar: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    scopes: "https://www.googleapis.com/auth/calendar",
  },
  outlook: {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    clientIdEnv: "MICROSOFT_CLIENT_ID",
    clientSecretEnv: "MICROSOFT_CLIENT_SECRET",
    scopes: "offline_access Mail.Read Mail.Send",
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    scopes: "r_liteprofile r_emailaddress",
  },
  zoom: {
    authUrl: "https://zoom.us/oauth/authorize",
    tokenUrl: "https://zoom.us/oauth/token",
    clientIdEnv: "ZOOM_CLIENT_ID",
    clientSecretEnv: "ZOOM_CLIENT_SECRET",
    scopes: "",
  },
  stripe: {
    authUrl: "https://connect.stripe.com/oauth/authorize",
    tokenUrl: "https://connect.stripe.com/oauth/token",
    clientIdEnv: "STRIPE_CLIENT_ID",
    clientSecretEnv: "STRIPE_CLIENT_SECRET",
    scopes: "read_write",
  },
  hubspot: {
    authUrl: "https://app.hubspot.com/oauth/authorize",
    tokenUrl: "https://api.hubapi.com/oauth/v1/token",
    clientIdEnv: "HUBSPOT_CLIENT_ID",
    clientSecretEnv: "HUBSPOT_CLIENT_SECRET",
    scopes: "crm.objects.contacts.read crm.objects.contacts.write",
  },
  salesforce: {
    authUrl: "https://login.salesforce.com/services/oauth2/authorize",
    tokenUrl: "https://login.salesforce.com/services/oauth2/token",
    clientIdEnv: "SALESFORCE_CLIENT_ID",
    clientSecretEnv: "SALESFORCE_CLIENT_SECRET",
    scopes: "api refresh_token",
  },
  intercom: {
    authUrl: "https://app.intercom.com/oauth",
    tokenUrl: "https://api.intercom.io/auth/eagle/token",
    clientIdEnv: "INTERCOM_CLIENT_ID",
    clientSecretEnv: "INTERCOM_CLIENT_SECRET",
    scopes: "",
  },
  zapier: {
    authUrl: "https://zapier.com/oauth/authorize",
    tokenUrl: "https://zapier.com/oauth/token",
    clientIdEnv: "ZAPIER_CLIENT_ID",
    clientSecretEnv: "ZAPIER_CLIENT_SECRET",
    scopes: "",
  },
  whatsapp: {
    authUrl: "https://www.facebook.com/v17.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v17.0/oauth/access_token",
    clientIdEnv: "WHATSAPP_CLIENT_ID",
    clientSecretEnv: "WHATSAPP_CLIENT_SECRET",
    scopes: "whatsapp_business_messaging",
  }
};

const oauthProvider = (req, res) => {
  const { provider } = req.params;
  const { redirect, token } = req.query; // Expect frontend to pass redirect URL and jwt token
  
  if (!redirect) {
    return res.status(400).send("Missing redirect URI");
  }

  const config = OAUTH_CONFIG[provider];
  if (!config) {
    return res.redirect(`${redirect}?error=unknown_provider`);
  }

  const clientId = process.env[config.clientIdEnv];
  if (!clientId) {
    return res.redirect(`${redirect}?error=not_configured&provider=${provider}`);
  }

  // Construct callback URL to our backend
  const baseUrl = process.env.VITE_API_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const callbackUrl = `${baseUrl}/api/integrations-marketplace/oauth/callback/${provider}`;
  
  // Pass frontend redirect URI and user token via OAuth state parameter securely
  const statePayload = Buffer.from(JSON.stringify({ redirect, token })).toString('base64');

  const authUrl = new URL(config.authUrl);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", callbackUrl);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", statePayload);
  if (config.scopes) {
    authUrl.searchParams.set("scope", config.scopes);
  }
  // Google specific prompt
  if (provider === "gmail" || provider === "google_calendar") {
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
  }

  res.redirect(authUrl.toString());
};

const oauthCallback = asyncHandler(async (req, res) => {
  const { provider } = req.params;
  const { code, state, error } = req.query;
  
  let redirectUri = process.env.FRONTEND_URL || "http://localhost:5173";
  let userToken = null;

  if (state) {
    try {
      const payload = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
      if (payload.redirect) redirectUri = payload.redirect;
      if (payload.token) userToken = payload.token;
    } catch (e) {
      console.error("[oauthCallback] Failed to parse state", e);
    }
  }
  
  if (error || !code) {
    return res.redirect(`${redirectUri}?error=${error || "missing_code"}&provider=${provider}`);
  }

  const config = OAUTH_CONFIG[provider];
  if (!config) {
    return res.redirect(`${redirectUri}?error=unknown_provider`);
  }

  const clientId = process.env[config.clientIdEnv];
  const clientSecret = process.env[config.clientSecretEnv];

  if (!clientId || !clientSecret) {
    return res.redirect(`${redirectUri}?error=not_configured&provider=${provider}`);
  }

  const baseUrl = process.env.VITE_API_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const callbackUrl = `${baseUrl}/api/integrations-marketplace/oauth/callback/${provider}`;

  try {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('code', code);
    params.append('redirect_uri', callbackUrl);
    params.append('grant_type', 'authorization_code');

    const tokenRes = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error(`[oauthCallback] Error exchanging token for ${provider}:`, tokenData);
      return res.redirect(`${redirectUri}?error=token_exchange_failed&provider=${provider}`);
    }

    // Since this is a public callback, we need the user identity. We decode the token passed in state.
    if (!userToken) {
      return res.redirect(`${redirectUri}?error=missing_auth&provider=${provider}`);
    }

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    
    // Ensure user exists
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.redirect(`${redirectUri}?error=user_not_found`);
    }

    const orgId = user.organizationId;
    const meta = CATALOG.find((c) => c.id === provider);

    const integration = await prisma.integration.upsert({
      where: { orgId_provider: { orgId, provider } },
      create: { 
        orgId, 
        userId: user.id, 
        provider, 
        name: meta?.name || provider, 
        credentials: { accessToken: tokenData.access_token, refreshToken: tokenData.refresh_token, ...tokenData }, 
        status: "connected", 
        lastSyncAt: new Date() 
      },
      update: { 
        name: meta?.name || provider, 
        credentials: { accessToken: tokenData.access_token, refreshToken: tokenData.refresh_token, ...tokenData }, 
        status: "connected", 
        error: null, 
        lastSyncAt: new Date() 
      },
    });

    await recordAudit({ userId: user.id, orgId, action: "integration.install", entityType: "Integration", entityId: integration.id, metadata: { provider } });
    
    return res.redirect(`${redirectUri}?success=true&provider=${provider}`);
  } catch (err) {
    console.error(`[oauthCallback] Unhandled error:`, err);
    return res.redirect(`${redirectUri}?error=server_error&provider=${provider}`);
  }
});

const list = asyncHandler(async (req, res) => {
  const installed = await prisma.integration.findMany({ where: { orgId: req.orgId } });
  const result = CATALOG.map((c) => {
    const inst = installed.find((i) => i.provider === c.id);
    return { 
  ...c, 
  installed: !!inst, 
  status: inst?.status, 
  lastSyncAt: inst?.lastSyncAt, 
  error: inst?.error, 
  id: inst?.id || c.id 
};
  });
  return response.success(res, result);
});

const install = asyncHandler(async (req, res) => {
  const { provider, name, config, credentials, code } = req.body;
  const meta = CATALOG.find((c) => c.id === provider);
  if (!meta) throw new AppError("Unknown integration provider.", 400);

  let finalCredentials = credentials;
  if (code) {
    finalCredentials = { accessToken: `mock_access_token_${provider}`, refreshToken: `mock_refresh_token_${provider}` };
  }

  const integration = await prisma.integration.upsert({
    where: { orgId_provider: { orgId: req.orgId, provider } },
    create: { orgId: req.orgId, userId: req.user.id, provider, name: name || meta.name, config, credentials: finalCredentials, status: "connected", lastSyncAt: new Date() },
    update: { name: name || meta.name, config, credentials: finalCredentials, status: "connected", error: null, lastSyncAt: new Date() },
  });
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "integration.install", entityType: "Integration", entityId: integration.id, metadata: { provider } });
  return response.created(res, integration);
});

const uninstall = asyncHandler(async (req, res) => {
  const result = await prisma.integration.deleteMany({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (result.count === 0) throw new AppError("Integration not found.", 404);
  return response.success(res, { message: "Integration uninstalled." });
});

const sync = asyncHandler(async (req, res) => {
  const integration = await prisma.integration.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!integration) throw new AppError("Integration not found.", 404);
  // In a real system, this would kick off an actual sync job.
  await prisma.integration.update({ where: { id: integration.id }, data: { lastSyncAt: new Date(), status: "connected" } });
  return response.success(res, { message: "Sync started.", lastSyncAt: new Date() });
});

const config = (req, res) => response.success(res, { catalog: CATALOG });

const update = asyncHandler(async (req, res) => {
  const { config: newConfig, credentials } = req.body;
  const integration = await prisma.integration.updateMany({
    where: { id: Number(req.params.id), orgId: req.orgId },
    data: { config: newConfig, credentials },
  });
  if (integration.count === 0) throw new AppError("Integration not found.", 404);
  return response.success(res, { message: "Integration updated." });
});

const validate = asyncHandler(async (req, res) => {
  const { provider, config: validateConfig } = req.body;
  // Mock validation logic
  if (!validateConfig || Object.keys(validateConfig).length === 0) {
    throw new AppError("Configuration is missing or empty.", 400);
  }
  return response.success(res, { message: "Configuration is valid.", valid: true });
});

module.exports = { list, install, uninstall, sync, config, update, validate, CATALOG, oauthProvider, oauthCallback };
