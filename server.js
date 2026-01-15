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
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // API: Matches (Dynamic Read)
    if (pathname === '/api/matches') {
        const matchesFile = path.join(__dirname, 'matches.json');
        fs.readFile(matchesFile, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading matches.json:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                // Return empty structure on error to prevent frontend crash
                res.end(JSON.stringify({ today: [], yesterday: [], tomorrow: [] }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        });
        return;
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

                        // Construct absolute URL for segments
                        let absoluteUrl = line;
                        if (!line.startsWith('http')) {
                            absoluteUrl = baseUrl + line;
                        }

                        // Proxy the segment URL
                        // Use relative proxy path to work on any host
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
