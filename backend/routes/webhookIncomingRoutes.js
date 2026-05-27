// Incoming webhook endpoint. Public; secured via HMAC signature.
const express = require("express");
const router = express.Router();
const { incoming } = require("../controllers/webhookIncomingController");

router.post("/incoming", incoming);

module.exports = router;
