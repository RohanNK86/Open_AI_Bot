import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateResponse, clearConversationHistory } from './gemini-service.js';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 3001;

app.disable('x-powered-by');
app.use(cors({
    origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
        : true
}));
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use((req, res, next) => {
    if (req.path === '/' || req.path === '/login' || req.path === '/chatbot') {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }
    next();
});

const proxyTarget = process.env.PROXY_TARGET || 'http://localhost:3002';
const proxyError = (err, req, res) => {
    console.error('Proxy error:', err);
    if (res.headersSent) return;
    const isConnRefused = err.code === 'ECONNREFUSED';
    res.status(isConnRefused ? 503 : 500).json({
        error: isConnRefused ? 'Authentication backend is offline.' : 'Proxy error',
        message: err.message
    });
};

app.use('/backend', createProxyMiddleware({
    target: proxyTarget,
    changeOrigin: true,
    timeout: 5000,
    proxyTimeout: 5000,
    pathRewrite: requestPath => requestPath.replace(/^\/backend/, '') || '/',
    onError: proxyError
}));

app.use('/users', createProxyMiddleware({
    target: proxyTarget,
    changeOrigin: true,
    timeout: 5000,
    proxyTimeout: 5000,
    pathRewrite: requestPath => `/users${requestPath}`,
    onError: proxyError
}));

app.use(express.json({ limit: '100kb' }));

const getUserId = (req, res, next) => {
    req.userId = 'guest';
    next();
};

app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'login.html'));
});
app.get('/chatbot', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.post('/api/chat', getUserId, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }
        const response = await generateResponse(req.userId, message);
        res.json({ reply: response });
    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

app.post('/api/clear-history', getUserId, (req, res) => {
    try {
        clearConversationHistory(req.userId);
        res.json({ success: true });
    } catch (error) {
        console.error('Clear history error:', error);
        res.status(500).json({ error: 'Failed to clear history' });
    }
});

app.get('/api/config', (req, res) => {
    res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID || null });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
