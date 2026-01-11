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
const MATCHES_FILE = path.join(__dirname, 'matches.json');

// Initialize matches data
let matchesData = {
    today: [],
    tomorrow: [],
    yesterday: []
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
    const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://ayoubalgboom-bot.github.io', // Replace with your GitHub Pages URL
        '*' // Allow all for now, tighten in production
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
            res.writeHead(proxyRes.statusCode, {
                'Content-Type': proxyRes.headers['content-type'] || 'application/vnd.apple.mpegurl',
                'Access-Control-Allow-Origin': '*'
            });

            if (streamUrl.includes('.m3u8') && proxyRes.statusCode === 200) {
                let data = '';
                proxyRes.on('data', (chunk) => data += chunk.toString());
                proxyRes.on('end', () => {
                    const baseUrl = streamUrl.substring(0, streamUrl.lastIndexOf('/') + 1);
                    const lines = data.split('\n');
                    const modifiedLines = lines.map(line => {
                        line = line.trim();
                        if (!line || line.startsWith('#')) return line;
                        if (!line.match(/^https?:\/\//)) {
                            const absoluteUrl = baseUrl + line;
                            return `http://localhost:${PORT}/proxy?url=${encodeURIComponent(absoluteUrl)}`;
                        } else {
                            return `http://localhost:${PORT}/proxy?url=${encodeURIComponent(line)}`;
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

server.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📺 Proxy: http://localhost:${PORT}/proxy?url=STREAM_URL`);
    console.log(`🎮 Admin Panel: http://localhost:${PORT}/admin.html`);
    console.log(`📊 API: http://localhost:${PORT}/api/matches\n`);
});
