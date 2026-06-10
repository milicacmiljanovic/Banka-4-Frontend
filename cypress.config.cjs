const { defineConfig } = require("cypress");

module.exports = defineConfig({
    e2e: {
        baseUrl: "http://localhost:5173",

        env: {
            API_URL: process.env.CYPRESS_API_URL || "http://rafsi.davidovic.io:8080/api",
            BANKING_API_URL: process.env.CYPRESS_BANKING_API_URL || "http://rafsi.davidovic.io:8081/api",
            TRADING_API_URL: process.env.CYPRESS_TRADING_API_URL || "http://rafsi.davidovic.io:8082/api",
            ANA_EMAIL: process.env.CYPRESS_ANA_EMAIL || "ana.anic@example.com",
            ANA_PASSWORD: process.env.CYPRESS_ANA_PASSWORD || "password123",
            ANA_ACCOUNT: process.env.CYPRESS_ANA_ACCOUNT || "444000112345678913",
        },

        setupNodeEvents(on, config) {
            return config;
        },
    },
});
