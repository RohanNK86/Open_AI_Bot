import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { generateResponse, clearConversationHistory } from './gemini-service.js';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();
// Add this after dotenv.config()
console.log('Environment variables loaded:', {
    port: process.env.PORT,
    hasApiKey: !!process.env.GEMINI_API_KEY,
    apiKeyStartsWith: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'No API key'
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(cors());
app.use(limiter);
app.use('/static', express.static(path.join(__dirname, 'static')));

// Proxy API requests (Must be BEFORE body-parser so the stream isn't consumed)
// Backend (auth) server runs from `backend/app.js` and defaults to port 3001.
const proxyTarget = process.env.PROXY_TARGET || 'http://localhost:3002';
console.log(`Proxying /users to ${proxyTarget}`);

app.use('/users', createProxyMiddleware({
    target: proxyTarget,
    changeOrigin: true,
    logLevel: 'debug',
    // Because this middleware is mounted at `/users`, Express strips that prefix
    // and the proxy would forward `/signIN` instead of `/users/signIN`.
    // Re-add the prefix so the backend (mounted at `/users`) receives the right path.
    pathRewrite: (path) => `/users${path}`,
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.writeHead(500, {
            'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ message: 'Proxy error', error: err.message }));
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`Proxy response status: ${proxyRes.statusCode}`);
    }
}));

// Body Parser for other routes
app.use(bodyParser.json());

const getUserId = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-for-jwt-that-needs-to-be-long');
        req.userId = decoded.id;
        next();
    } catch (err) {
        console.error('Invalid token:', err.message);
        return res.status(401).json({ error: 'Unauthorized: expired or invalid token' });
    }
};

// Routes
app.get('/', (req, res) => {
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

        console.log(`Generating response for userId: ${userId}, message: "${message.substring(0, 50)}..."`);
        const response = await generateResponse(userId, message);
        console.log(`Response generated successfully for userId: ${userId}`);
        res.json({ reply: response });
    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Endpoint to clear conversation history
app.post('/api/clear-history', getUserId, (req, res) => {
    try {
        const { userId } = req;
        clearConversationHistory(userId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing history:', error);
        res.status(500).json({ error: 'Failed to clear history' });
    }
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
    console.log(`Server is running on http://localhost:${port}`);
});