// Simple in-memory feature flag store. Defaults to permissive in dev.
const flags = {
  aiScoring: true,
  newLeadsUI: true,
  betaReports: false,
  darkMode: true,
  emailTracking: true,
  voiceNotes: false,
  advancedForecasting: true,
};

const isEnabled = (name) => flags[name] !== false;

const set = (name, value) => { flags[name] = !!value; };
const all = () => ({ ...flags });

module.exports = { isEnabled, set, all, flags };
