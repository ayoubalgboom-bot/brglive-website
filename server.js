const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    // Parse URL
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Global CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // API: Matches (Dynamic Read/Write)
    if (pathname.startsWith('/api/matches')) {
        const matchesFile = path.join(__dirname, 'matches.json');

        // Helper: Read Body
        const readBody = () => new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => resolve(body));
            req.on('error', reject);
        });

        // Helper: Read Matches
        const readMatches = () => {
            try {
                if (fs.existsSync(matchesFile)) {
                    return JSON.parse(fs.readFileSync(matchesFile, 'utf8'));
                }
            } catch (e) { console.error(e); }
            return { today: [], yesterday: [], tomorrow: [] };
        };

        // Helper: Save Matches
        const saveMatches = (data) => {
            fs.writeFileSync(matchesFile, JSON.stringify(data, null, 2));
        };

        // Helper function to handle response
        const sendJSON = (code, data) => {
            res.writeHead(code, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        };

        // 1. Shift Day: POST /api/matches/shift
        if (pathname === '/api/matches/shift' && req.method === 'POST') {
            const data = readMatches();
            data.yesterday = [...(data.today || [])];
            data.today = [...(data.tomorrow || [])];
            data.tomorrow = [];
            saveMatches(data);
            return sendJSON(200, { success: true });
        }

        // Parse path parts: /api/matches/today/0 -> ["", "api", "matches", "today", "0"]
        const parts = pathname.split('/').filter(p => p.length > 0);
        // parts[0]="api", parts[1]="matches", parts[2]=day, parts[3]=index
        const paramDay = parts[2];
        const paramIndex = parts[3];

        // GET: List Matches
        if (pathname === '/api/matches' && req.method === 'GET') {
            const data = readMatches();
            return sendJSON(200, data);
        }

        // 2. Add Match: POST /api/matches/:day
        if (paramDay && !paramIndex && req.method === 'POST') {
            readBody().then(body => {
                const newMatch = JSON.parse(body);
                const data = readMatches();
                if (!data[paramDay]) data[paramDay] = [];
                data[paramDay].push(newMatch);
                saveMatches(data);
                sendJSON(201, { success: true });
            }).catch(err => sendJSON(500, { error: err.message }));
            return;
        }

        // 3. Update Match: PUT /api/matches/:day/:index
        if (paramDay && paramIndex !== undefined && req.method === 'PUT') {
            const index = parseInt(paramIndex);
            readBody().then(body => {
                const updatedMatch = JSON.parse(body);
                const data = readMatches();
                if (data[paramDay] && data[paramDay][index]) {
                    data[paramDay][index] = updatedMatch;
                    saveMatches(data);
                    sendJSON(200, { success: true });
                } else {
                    sendJSON(404, { error: 'Match not found' });
                }
            }).catch(err => sendJSON(500, { error: err.message }));
            return;
        }

        // 4. Delete Match: DELETE /api/matches/:day/:index
        if (paramDay && paramIndex !== undefined && req.method === 'DELETE') {
            const index = parseInt(paramIndex);
            const data = readMatches();
            if (data[paramDay] && data[paramDay][index]) {
                data[paramDay].splice(index, 1);
                saveMatches(data);
                sendJSON(200, { success: true });
            } else {
                sendJSON(404, { error: 'Match not found' });
            }
            return;
        }
    }

    // API: Channels (Dynamic Read)
    if (pathname === '/api/channels') {
        const channelsFile = path.join(__dirname, 'channels.json');
        fs.readFile(channelsFile, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading channels.json:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify([]));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        });
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
                'Connection': 'keep-alive'
            }
        };

        const proxyReq = protocol.request(options, (proxyRes) => {
            // Handle Redirects
            if ([301, 302, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
                const redirectUrl = proxyRes.headers.location;
                // Encode the redirect URL properly for the proxy
                res.writeHead(302, { 'Location': `/proxy?url=${encodeURIComponent(redirectUrl)}` });
                res.end();
                return;
            }

            // Forward Headers
            const headers = { ...proxyRes.headers };
            headers['Access-Control-Allow-Origin'] = '*';
            res.writeHead(proxyRes.statusCode, headers);

            // Handle M3U8 Content
            if (streamUrl.includes('.m3u8') && proxyRes.statusCode === 200) {
                let data = '';
                proxyRes.on('data', (chunk) => data += chunk.toString());
                proxyRes.on('end', () => {
                    const baseUrl = streamUrl.substring(0, streamUrl.lastIndexOf('/') + 1);
                    const lines = data.split('\n');
                    const modifiedLines = lines.map(line => {
                        line = line.trim();
                        if (!line || line.startsWith('#')) return line;

                        // Construct absolute URL
                        let absoluteUrl = line;
                        if (!line.startsWith('http')) {
                            absoluteUrl = baseUrl + line;
                        }

                        // Proxy
                        return `/proxy?url=${encodeURIComponent(absoluteUrl)}`;
                    });
                    res.end(modifiedLines.join('\n'));
                });
            } else {
                proxyRes.pipe(res);
            }
        });

        proxyReq.on('error', (err) => {
            console.error('Proxy Error:', err);
            res.writeHead(500);
            res.end('Proxy Error');
        });

        proxyReq.end();
        return;
    }

    // Static File Serving
    let filePath = pathname === '/' ? '/index.html' : pathname;
    const extname = path.extname(filePath);
    const contentTypeMap = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
    };
    const contentType = contentTypeMap[extname] || 'application/octet-stream';

    const absolutePath = path.join(__dirname, filePath);

    // Security Check
    if (!absolutePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(absolutePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
