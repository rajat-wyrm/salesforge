const { defineConfig } = require('@prisma/config');
require('dotenv').config();

module.exports = defineConfig({
  seed: 'node prisma/seed.js'
});
