import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { generateResponse, clearConversationHistory } from './gemini-service.js';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

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
const port = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(limiter);
app.use('/static', express.static(path.join(__dirname, 'static')));

// Proxy API requests
const proxyTarget = process.env.PROXY_TARGET || 'http://localhost:3002';
console.log(`Proxying /users to ${proxyTarget}`);

app.use('/users', createProxyMiddleware({
    target: proxyTarget,
    changeOrigin: true,
    logLevel: 'debug',
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

// Simple middleware to generate or get user ID
const getUserId = (req, res, next) => {
    // In a real app, you'd get this from authentication
    req.userId = req.headers['x-user-id'] || 'guest';
    next();
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

        const response = await generateResponse(userId, message);
        res.json({ reply: response });
    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
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