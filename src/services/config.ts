// src/services/config.ts

// This file contains the hardcoded API key for Twitter
// and the base URLs for the proxy.

const API_CONFIG = {
  twitter: {
    baseUrl: '/twitter-api',
    // This is the base64 encoded version of b8d23504206b4ebe86be0a4329e1e727
    key: atob('YjhkMjM1MDQyMDZiNGViZTg2YmUwYTQzMjllMWU3Mjc=')
  },
  ai: {
    baseUrl: '/ai-api',
    key: atob('c2stM0JXMXZQT2RHRXlHaEJwclZqb3VxUTdpTmdSc1Y0WUlxWTRrTll2SnBham1MeW53')
  },
  telegram: {
    baseUrl: '/telegram-api'
  }
};

export default API_CONFIG;
