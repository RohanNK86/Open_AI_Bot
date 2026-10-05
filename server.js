import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateResponse, clearConversationHistory } from './gemini-service.js';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Load environment variables
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy for deployment (Heroku, Render, etc.)
app.set('trust proxy', 1);

const port = process.env.PORT || 3001;

// Middleware
app.disable('x-powered-by');
app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : true
}));
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use((req, res, next) => {
    if (req.path === '/login' || req.path === '/chatbot' || req.path === '/') {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }
    next();
});

// Proxy API requests (Must be BEFORE body-parser so the stream isn't consumed)
// Backend (auth) server runs from `backend/app.js` and defaults to port 3002.
const proxyTarget = process.env.PROXY_TARGET || 'http://localhost:3002';
console.log(`Proxying /users to ${proxyTarget}`);

// Temporary backend passthrough for local development. For example:
// http://localhost:3001/backend/health -> http://localhost:3002/health
app.use('/backend', createProxyMiddleware({
    target: proxyTarget,
    changeOrigin: true,
    logLevel: 'debug',
    timeout: 5000,
    proxyTimeout: 5000,
    pathRewrite: (path) => path.replace(/^\/backend/, '') || '/',
    onError: (err, req, res) => {
        console.error('Backend proxy error:', err);
        if (res.headersSent) return;

        const isConnRefused = err.code === 'ECONNREFUSED';
        res.writeHead(isConnRefused ? 503 : 500, {
            'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({
            error: isConnRefused
                ? 'Backend is offline. Start the backend in a second terminal.'
                : 'Backend proxy error',
            message: err.message
        }));
    }
}));

app.use('/users', createProxyMiddleware({
    target: proxyTarget,
    changeOrigin: true,
    logLevel: 'debug',
    timeout: 5000,
    proxyTimeout: 5000,
    pathRewrite: (path) => `/users${path}`,
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        if (res.headersSent) return;

        const isConnRefused = err.code === 'ECONNREFUSED';
        res.writeHead(isConnRefused ? 503 : 500, {
            'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({
            message: isConnRefused
                ? 'Authentication backend is offline. Make sure to run the backend server.'
                : 'Proxy error',
            error: err.message,
            hint: 'If deployed, ensure PROXY_TARGET environment variable is set to your backend URL.'
        }));
    }
}));

// Parse JSON after proxy routes have access to the original request stream.
app.use(express.json({ limit: '100kb' }));

// Authentication Middleware
const getUserId = (req, res, next) => {
    req.userId = 'guest';
    next();
    /*
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader === 'Bearer null') {
        // Temporarily bypassed auth to allow homepage access without login
        req.userId = 'guest';
        return next();
        // return res.status(401).json({ error: 'Unauthorized: missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    try {
        if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
            return res.status(500).json({ error: 'JWT_SECRET is not configured' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        console.error('Invalid token:', err.message);
        // Temporarily bypassed auth to allow homepage access without login
        req.userId = 'guest';
        return next();
        // return res.status(401).json({ error: 'Unauthorized: expired or invalid token' });
    }
    */
};

// Pages
app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'login.html'));
});

app.get('/chatbot', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// API endpoint to get AI response
app.post('/api/chat', getUserId, async (req, res) => {
    try {
        const { message } = req.body;
        const { userId } = req;

        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`Generating response for userId: ${userId}`);
        const response = await generateResponse(userId, message);
        res.json({ reply: response });
    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Endpoint to clear conversation history
app.post('/api/clear-history', getUserId, (req, res) => {
    try {
        clearConversationHistory(req.userId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear history' });
    }
});

app.get('/api/config', (req, res) => {
    res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID || null });
});

// Simple health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});