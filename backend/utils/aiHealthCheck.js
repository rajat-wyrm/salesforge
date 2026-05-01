const axios = require("axios");

async function checkAIService() {
  try {
    const aiURL = process.env.AI_URL.replace("/recommend", "") + "/health";

    const res = await axios.get(aiURL);
    console.log("🟢 AI Microservice Connected:", res.data);
  } catch (err) {
    console.error("🔴 AI Microservice Not Reachable:", err.message);
  }
}

module.exports = checkAIService;
