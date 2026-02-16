const http = require('http');
const fs = require('fs');
const path = require('path');
const PeriodEngine = require('./engine');

const engine = new PeriodEngine(path.join(__dirname, 'data.json'));

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
    } else if (req.url === '/api/status') {
        const next = engine.predictNext() || "Log more data";
        const phase = engine.getPhase(new Date());
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ next, phase }));
    } else if (req.url === '/api/add' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const params = JSON.parse(body);
            engine.addPeriod(params.date, params.duration);
            res.end(JSON.stringify({ success: true }));
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Aura App running at http://localhost:${PORT}`);
});
