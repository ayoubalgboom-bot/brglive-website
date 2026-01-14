/**
 * Enhanced Server with Proxy + Admin API
 * Handles stream proxying and match management
 */

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const MATCHES_FILE = path.join(__dirname, 'matches.json');
const CHANNELS_FILE = path.join(__dirname, 'channels.json');

// Initialize matches data
let matchesData = {
    today: [],
    tomorrow: [],
    yesterday: []
};

// Initialize channels data
let channelsData = {
    channels: []
};

// Load matches from file
function loadMatches() {
    try {
        if (fs.existsSync(MATCHES_FILE)) {
            const data = fs.readFileSync(MATCHES_FILE, 'utf8');
            matchesData = JSON.parse(data);
            console.log('✅ Matches loaded from file');
        } else {
            // Load from main.js if matches.json doesn't exist
            loadFromMainJs();
        }
    } catch (error) {
        console.error('Error loading matches:', error);
        loadFromMainJs();
    }
}

// Load initial data from main.js
function loadFromMainJs() {
    matchesData = {
        today: [
            {
                home: 'برشلونة', away: 'ريال مدريد', score: '0 - 0', status: '23:00', time: '23:00',
                league: 'الدوري الإسباني', channel: 'beIN Sports 1', commentator: 'عصام الشوالي',
                homeLogo: 'assets/barcelona.png', awayLogo: 'assets/real_madrid.png',
                streamUrl: 'http://het129c.ycn-redirect.com/live/918454578001/index.m3u8?t=dt_PzZsOxY6_xqEQ7PGKtw&e=1768111577'
            }
        ],
        tomorrow: [],
        yesterday: []
    };
    saveMatches();
}

// Save matches to file
function saveMatches() {
    try {
        fs.writeFileSync(MATCHES_FILE, JSON.stringify(matchesData, null, 2));
        console.log('💾 Matches saved to file');
    } catch (error) {
        console.error('Error saving matches:', error);
    }
}

// Load channels from file
function loadChannels() {
    try {
        if (fs.existsSync(CHANNELS_FILE)) {
            const data = fs.readFileSync(CHANNELS_FILE, 'utf8');
            channelsData = JSON.parse(data);
            console.log('✅ Channels loaded from file');
        } else {
            // Create default channels file
            saveChannels();
        }
    } catch (error) {
        console.error('Error loading channels:', error);
    }
}

// Save channels to file
function saveChannels() {
    try {
        fs.writeFileSync(CHANNELS_FILE, JSON.stringify(channelsData, null, 2));
        console.log('💾 Channels saved to file');
    } catch (error) {
        console.error('Error saving channels:', error);
    }
}

// Parse request body
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}

// Main server
const server = http.createServer(async (req, res) => {
    // Enable CORS for both local and production
    // Enable CORS for all domains (since we have dynamic tunnel URLs and custom domains)
    const origin = req.headers.origin;

    // Check if origin is present (browser request)
    if (origin) {
        // Allow the specific origin that is requesting
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        // Fallback for non-browser requests
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Bypass-Tunnel-Reminder, ngrok-skip-browser-warning');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // API Routes
    if (pathname === '/api/matches') {
        // GET all matches
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(matchesData));
        return;
    }

    // Shift Day Endpoint
    if (pathname === '/api/matches/shift' && req.method === 'POST') {
        // Move Today -> Yesterday
        matchesData.yesterday = [...matchesData.today];
        // Move Tomorrow -> Today
        matchesData.today = [...matchesData.tomorrow];
        // Clear Tomorrow
        matchesData.tomorrow = [];

        saveMatches();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Day shifted successfully' }));
        return;
    }

    if (pathname.match(/^\/api\/matches\/(today|tomorrow|yesterday)$/)) {
        const day = pathname.split('/')[3];

        if (req.method === 'POST') {
            // Add new match
            const matchData = await parseBody(req);
            matchesData[day].push(matchData);
            saveMatches();
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
            return;
        }
    }

    if (pathname.match(/^\/api\/matches\/(today|tomorrow|yesterday)\/\d+$/)) {
        const parts = pathname.split('/');
        const day = parts[3];
        const index = parseInt(parts[4]);

        if (req.method === 'PUT') {
            // Update match
            const matchData = await parseBody(req);
            matchesData[day][index] = matchData;
            saveMatches();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
            return;
        }

        if (req.method === 'DELETE') {
            // Delete match
            matchesData[day].splice(index, 1);
            saveMatches();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
            return;
        }
    }

    // ========== CHANNELS API ENDPOINTS ==========

    // GET all channels
    if (pathname === '/api/channels' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(channelsData));
        return;
    }

    // POST new channel
    if (pathname === '/api/channels' && req.method === 'POST') {
        const channelData = await parseBody(req);
        // Generate ID
        const newId = channelsData.channels.length > 0
            ? String(Math.max(...channelsData.channels.map(c => parseInt(c.id))) + 1)
            : '1';
        channelData.id = newId;
        channelsData.channels.push(channelData);
        saveChannels();
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, channel: channelData }));
        return;
    }

    // PUT update channel by ID
    if (pathname.match(/^\/api\/channels\/\d+$/) && req.method === 'PUT') {
        const channelId = pathname.split('/')[3];
        const channelData = await parseBody(req);
        const index = channelsData.channels.findIndex(c => c.id === channelId);

        if (index !== -1) {
            channelsData.channels[index] = { ...channelsData.channels[index], ...channelData, id: channelId };
            saveChannels();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Channel not found' }));
        }
        return;
    }

    // DELETE channel by ID
    if (pathname.match(/^\/api\/channels\/\d+$/) && req.method === 'DELETE') {
        const channelId = pathname.split('/')[3];
        const index = channelsData.channels.findIndex(c => c.id === channelId);

        if (index !== -1) {
            channelsData.channels.splice(index, 1);
            saveChannels();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Channel not found' }));
        }
        return;
    }

    // Proxy Route
    if (pathname === '/proxy') {
        const streamUrl = parsedUrl.query.url;

        if (!streamUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No stream URL provided' }));
            return;
        }

        console.log(`Proxying: ${streamUrl}`);

        const targetUrl = url.parse(streamUrl);
        const protocol = targetUrl.protocol === 'https:' ? https : http;

        const options = {
            hostname: targetUrl.hostname,
            port: targetUrl.port,
            path: targetUrl.path,
            method: 'GET',
            headers: {
                'Referer': 'https://x.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive'
            }
        };

        const proxyReq = protocol.request(options, (proxyRes) => {
            // Handle redirects (301, 302, 307, 308)
            if ([301, 302, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
                console.log(`Redirect detected: ${proxyRes.statusCode} -> ${proxyRes.headers.location}`);

                // Follow the redirect
                const redirectUrl = proxyRes.headers.location;
                const redirectProtocol = redirectUrl.startsWith('https') ? https : http;
                const redirectUrlParsed = url.parse(redirectUrl);

                const redirectOptions = {
                    hostname: redirectUrlParsed.hostname,
                    port: redirectUrlParsed.port,
                    path: redirectUrlParsed.path,
                    method: 'GET',
                    headers: options.headers
                };

                const redirectReq = redirectProtocol.request(redirectOptions, (redirectRes) => {
                    res.writeHead(redirectRes.statusCode, {
                        'Content-Type': redirectRes.headers['content-type'] || 'application/vnd.apple.mpegurl',
                        'Access-Control-Allow-Origin': '*'
                    });
                    redirectRes.pipe(res);
                });

                redirectReq.on('error', (err) => {
                    console.error('Redirect request error:', err);
                    res.writeHead(500);
                    res.end('Redirect request failed');
                });

                redirectReq.end();
                return;
            }

            res.writeHead(proxyRes.statusCode, {
                'Content-Type': proxyRes.headers['content-type'] || 'application/vnd.apple.mpegurl',
                'Access-Control-Allow-Origin': '*'
            });

            if (streamUrl.includes('.m3u8') && proxyRes.statusCode === 200) {
                let data = '';
                proxyRes.on('data', (chunk) => data += chunk.toString());
                proxyRes.on('end', () => {
                    const baseUrl = streamUrl.substring(0, streamUrl.lastIndexOf('/') + 1);
                    // Extract query parameters from the original stream URL
                    const urlParts = url.parse(streamUrl);
                    const queryString = urlParts.search || '';

                    const lines = data.split('\n');
                    const modifiedLines = lines.map(line => {
                        line = line.trim();
                        if (!line || line.startsWith('#')) return line;

                        // It's a URL (segment or nested playlist)
                        if (!line.match(/^https?:\/\//)) {
                            // Relative URL: Resolve against base URL and append original query string
                            // Using URL constructor to handle paths correctly, then adding query string
                            // Note: We simply append the query string. If the relative URL already has params, 
                            // we might need more complex logic, but usually m3u8 segments don't have params 
                            // if they are relative, while the master playlist params are needed.
                            // Better approach: manual concatenation to be safe with the extracted queryString which starts with ?

                            // Check if line already has a query string
                            const separator = line.includes('?') ? '&' : (queryString ? '?' : '');
                            const paramsToAdd = queryString.startsWith('?') ? queryString.substring(1) : queryString;

                            let absoluteUrl = baseUrl + line;
                            if (paramsToAdd) {
                                absoluteUrl += (absoluteUrl.includes('?') ? '&' : '?') + paramsToAdd;
                            }

                            // Use the host from the request headers to construct the proxy URL
                            const protocol = req.headers['x-forwarded-proto'] || 'http';
                            const host = req.headers.host;
                            const currentBaseUrl = `${protocol}://${host}`;

                            return `${currentBaseUrl}/proxy?url=${encodeURIComponent(absoluteUrl)}`;
                        } else {
                            // Absolute URL
                            const protocol = req.headers['x-forwarded-proto'] || 'http';
                            const host = req.headers.host;
                            const currentBaseUrl = `${protocol}://${host}`;

                            return `${currentBaseUrl}/proxy?url=${encodeURIComponent(line)}`;
                        }
                    });
                    res.end(modifiedLines.join('\n'));
                });
            } else {
                proxyRes.pipe(res);
            }
        });

        proxyReq.on('error', (error) => {
            console.error('Proxy error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        });

        proxyReq.end();
        return;
    }

    // Static file serving
    const filePath = pathname === '/' ? '/index.html' : pathname;
    const extname = path.extname(filePath);
    const contentTypeMap = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };
    const contentType = contentTypeMap[extname] || 'application/octet-stream';

    const absolutePath = path.join(__dirname, filePath);

    // Security check: prevent directory traversal
    if (!absolutePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Forbidden' }));
        return;
    }

    fs.readFile(absolutePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'File not found' }));
            } else {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Server error' }));
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
});

// Load matches on startup
loadMatches();
loadChannels();

server.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📺 Proxy: http://localhost:${PORT}/proxy?url=STREAM_URL`);
    console.log(`🎮 Admin Panel: http://localhost:${PORT}/admin.html`);
    console.log(`📊 API: http://localhost:${PORT}/api/matches\n`);
});
