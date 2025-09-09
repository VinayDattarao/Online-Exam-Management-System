const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 5000;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml'
};

// Create HTTP server
const server = http.createServer((req, res) => {
    // Enable CORS for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    let pathname = url.parse(req.url).pathname;
    
    // Default to index.html for root path
    if (pathname === '/') {
        pathname = '/index.html';
    }

    // Build file path
    const filePath = path.join(__dirname, pathname);
    
    // Get file extension for MIME type
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File not found
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>404 - File Not Found</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        h1 { color: #e53e3e; }
                    </style>
                </head>
                <body>
                    <h1>404 - File Not Found</h1>
                    <p>The requested file <strong>${pathname}</strong> was not found.</p>
                    <a href="/">Go back to home</a>
                </body>
                </html>
            `);
            return;
        }

        // Read and serve the file
        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>500 - Server Error</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            h1 { color: #e53e3e; }
                        </style>
                    </head>
                    <body>
                        <h1>500 - Server Error</h1>
                        <p>Unable to read file: ${pathname}</p>
                        <a href="/">Go back to home</a>
                    </body>
                    </html>
                `);
                return;
            }

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        });
    });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`ExamSecure server is running on http://0.0.0.0:${PORT}`);
    console.log(`Local access: http://localhost:${PORT}`);
    console.log('Server is ready to serve the online examination system.');
});

// Handle server errors
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please stop other services on this port and try again.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down ExamSecure server...');
    server.close(() => {
        console.log('Server stopped.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\nShutting down ExamSecure server...');
    server.close(() => {
        console.log('Server stopped.');
        process.exit(0);
    });
});