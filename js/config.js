/**
 * Configuration for brglive website
 * Handles local development vs production deployment
 */

const CONFIG = (() => {
    // Detect environment
    const isLocalhost = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

    // Production proxy URL - UPDATE THIS after deploying to Render
    const PRODUCTION_PROXY_URL = 'https://sheets-placing-atmosphere-psychology.trycloudflare.com'; // Cloudflare Tunnel URL

    // Production GitHub Pages URL for matches.json
    const PRODUCTION_MATCHES_URL = 'https://ayoubalgboom-bot.github.io/brglive-website/matches.json'; // Change this

    return {
        // Environment flag
        isDevelopment: isLocalhost,
        isProduction: !isLocalhost,

        // API Endpoints
        apiBase: isLocalhost ? 'http://localhost:3000/api/matches' : `${PRODUCTION_PROXY_URL}/api/matches`,
        matchesJsonUrl: isLocalhost ? null : PRODUCTION_MATCHES_URL,

        // Proxy URLs
        // Proxy URLs - Use Cloudflare for everything to ensure it works
        proxyUrl: `${PRODUCTION_PROXY_URL}/proxy`,

        // Helper function to get proxy URL for a stream
        getProxyUrl: function (streamUrl) {
            return `${this.proxyUrl}?url=${encodeURIComponent(streamUrl)}`;
        },

        // Helper function to get matches source
        getMatchesSource: function () {
            // Always use the API (Cloudflare Tunnel in production) to ensure 
            // the website shows the live data from your PC, not the old file on GitHub.
            return this.apiBase;
        }
    };
})();

// Make config available globally
window.CONFIG = CONFIG;

// Log environment info (useful for debugging)
console.log('🌍 Environment:', CONFIG.isDevelopment ? 'Development (Local)' : 'Production');
console.log('📡 Matches source:', CONFIG.getMatchesSource());
console.log('🎬 Proxy URL:', CONFIG.proxyUrl);








