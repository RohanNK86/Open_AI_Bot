import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const SYSTEM_PROMPT = `You are a helpful AI assistant created by Rohan, a student at MS Ramaiah Institute of Technology.
You are talking to a user through a chat interface. Be friendly, helpful, clear, and concise. Preserve useful context across turns.`;
const parsePositiveInteger = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const MAX_OUTPUT_TOKENS = parsePositiveInteger(process.env.GEMINI_MAX_OUTPUT_TOKENS, 4096);
const OPENROUTER_MAX_OUTPUT_TOKENS = parsePositiveInteger(
    process.env.OPEN_ROUTER_MAX_OUTPUT_TOKENS,
    1024
);
const OPENROUTER_TIMEOUT_MS = parsePositiveInteger(
    process.env.OPEN_ROUTER_TIMEOUT_MS,
    9000
);
const configuredHistoryMessages = parsePositiveInteger(process.env.GEMINI_MAX_HISTORY_MESSAGES, 40);
const MAX_HISTORY_MESSAGES = Math.max(2, configuredHistoryMessages - (configuredHistoryMessages % 2));
const OPENROUTER_API_URL = (
    process.env.OPEN_ROUTER_API_URL ||
    process.env.OPEN_ROUTER_PI_URL ||
    'https://openrouter.ai/api/v1/chat/completions'
).replace(/\/+$/, '');
const NVIDIA_MODEL_ID = process.env.OPEN_ROUTER_MODEL_ID || 'nvidia/nemotron-3.5-lightning:free';
const OPENROUTER_OPENAI_API_KEY = (
    process.env.OPEN_ROUTER_OPEN_API_KEYS ||
    process.env.OPEN_ROUTER_OPENAI_API_KEY
);
const OPENROUTER_OPENAI_MODEL_ID = (
    process.env.OPEN_ROUTER_OPEN_AI_MODEL_ID ||
    process.env.OPEN_ROUTER_OPENAI_MODEL_ID ||
    'google/gemma-4-26b-a4b-it:free'
);
const OPENROUTER_OPENAI_FALLBACK_MODEL_ID = (
    process.env.OPEN_ROUTER_OPEN_AI_FALLBACK_MODEL_ID || ''
);
const OPENROUTER_OPENAI_MAX_OUTPUT_TOKENS = parsePositiveInteger(
    process.env.OPEN_ROUTER_OPEN_AI_MAX_OUTPUT_TOKENS,
    1024
);
const OPENROUTER_OPENAI_TIMEOUT_MS = parsePositiveInteger(
    process.env.OPEN_ROUTER_OPEN_AI_TIMEOUT_MS,
    9000
);

let model;
let activeModelName = null;
try {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set');
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    activeModelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    model = genAI.getGenerativeModel({
        model: activeModelName,
        systemInstruction: SYSTEM_PROMPT
    });
    console.log(`Successfully initialized Gemini with model: ${activeModelName}`);
} catch (error) {
    console.error('Failed to initialize Gemini:', error.message);
}

const conversationHistory = new Map();
const getHistoryKey = (userId, provider) => `${userId}:${provider}`;

export async function generateResponse(userId, message, modelId = 'gemini-flash') {
    if (modelId === 'nemotron') {
        return generateOpenRouterResponse(userId, message);
    }
    if (modelId === 'chatgpt') {
        return generateOpenAIResponse(userId, message);
    }
    if (modelId !== 'gemini-flash') {
        throw new Error('Selected model is not available.');
    }
    if (!model) {
        throw new Error('Gemini is not configured. Set GEMINI_API_KEY and restart the server.');
    }

    const historyKey = getHistoryKey(userId, 'gemini');
    const history = conversationHistory.get(historyKey) || [];
    try {
        const chat = model.startChat({
            history,
            generationConfig: {
                maxOutputTokens: MAX_OUTPUT_TOKENS,
                temperature: 0.7
            }
        });
        const result = await chat.sendMessage(message);
        const text = (await result.response).text();
        if (!text || !text.trim()) {
            throw new Error('Gemini returned an empty response.');
        }
        history.push({ role: 'user', parts: [{ text: message }] });
        history.push({ role: 'model', parts: [{ text }] });
        conversationHistory.set(historyKey, history.slice(-MAX_HISTORY_MESSAGES));
        return text;
    } catch (error) {
        console.error(`Gemini API Error (${activeModelName}):`, error.message);
        throw new Error(`Gemini request failed: ${error.message}`);
    }
}

async function generateOpenRouterResponse(userId, message) {
    if (!process.env.OPEN_ROUTER_API_KEY) {
        throw new Error('NVIDIA is not configured. Set OPEN_ROUTER_API_KEY and restart the server.');
    }

    const historyKey = getHistoryKey(userId, 'nvidia');
    const history = conversationHistory.get(historyKey) || [];
    const endpoint = OPENROUTER_API_URL.endsWith('/chat/completions')
        ? OPENROUTER_API_URL
        : `${OPENROUTER_API_URL}/chat/completions`;

    let response;
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), OPENROUTER_TIMEOUT_MS);
    try {
        response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.OPEN_ROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.OPEN_ROUTER_SITE_URL || 'http://localhost:3001',
                'X-Title': process.env.OPEN_ROUTER_APP_NAME || 'NexorAI'
            },
            body: JSON.stringify({
                model: NVIDIA_MODEL_ID,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...history,
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: OPENROUTER_MAX_OUTPUT_TOKENS,
                reasoning: { effort: 'none', exclude: true },
                signal: abortController.signal
            })
        });
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(`NVIDIA request timed out after ${OPENROUTER_TIMEOUT_MS / 1000} seconds. Try a shorter prompt.`);
        }
        throw new Error(`NVIDIA request failed: ${error.message}`);
    } finally {
        clearTimeout(timeout);
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(`NVIDIA request failed: ${payload?.error?.message || `HTTP ${response.status}`}`);
    }
    const messageContent = payload?.choices?.[0]?.message?.content;
    const text = Array.isArray(messageContent)
        ? messageContent
            .filter(part => part?.type === 'text' && typeof part.text === 'string')
            .map(part => part.text)
            .join('')
        : messageContent;
    if (typeof text !== 'string' || !text.trim()) {
        const finishReason = payload?.choices?.[0]?.finish_reason;
        throw new Error(
            `NVIDIA returned an empty response${finishReason ? ` (${finishReason})` : ''}.`
        );
    }

    conversationHistory.set(historyKey, [
        ...history,
        { role: 'user', content: message },
        { role: 'assistant', content: text }
    ].slice(-MAX_HISTORY_MESSAGES));
    return text;
}

async function generateOpenAIResponse(userId, message) {
    if (!OPENROUTER_OPENAI_API_KEY) {
        throw new Error('ChatGPT is not configured. Set OPEN_ROUTER_OPEN_API_KEYS and restart the server.');
    }

    const historyKey = getHistoryKey(userId, 'openai');
    const history = conversationHistory.get(historyKey) || [];
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), OPENROUTER_OPENAI_TIMEOUT_MS);

    const models = [OPENROUTER_OPENAI_MODEL_ID];
    if (OPENROUTER_OPENAI_FALLBACK_MODEL_ID &&
        OPENROUTER_OPENAI_FALLBACK_MODEL_ID !== OPENROUTER_OPENAI_MODEL_ID) {
        models.push(OPENROUTER_OPENAI_FALLBACK_MODEL_ID);
    }
    let response;
    let payload;
    let lastRateLimitMessage = '';
    try {
        for (const modelId of models) {
            response = await fetch(
                OPENROUTER_API_URL.endsWith('/chat/completions')
                    ? OPENROUTER_API_URL
                    : `${OPENROUTER_API_URL}/chat/completions`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${OPENROUTER_OPENAI_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': process.env.OPEN_ROUTER_SITE_URL || 'http://localhost:3001',
                        'X-Title': process.env.OPEN_ROUTER_APP_NAME || 'NexorAI'
                    },
                    body: JSON.stringify({
                        model: modelId,
                        messages: [
                            { role: 'system', content: SYSTEM_PROMPT },
                            ...history,
                            { role: 'user', content: message }
                        ],
                        temperature: 0.7,
                        max_tokens: OPENROUTER_OPENAI_MAX_OUTPUT_TOKENS
                    }),
                    signal: abortController.signal
                }
            );
            payload = await response.json().catch(() => ({}));
            if (response.ok) break;
            if (response.status !== 429 || modelId === models[models.length - 1]) break;
            lastRateLimitMessage = payload?.error?.message || `HTTP ${response.status}`;
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(`ChatGPT request timed out after ${OPENROUTER_OPENAI_TIMEOUT_MS / 1000} seconds.`);
        }
        throw new Error(`ChatGPT/OpenRouter request failed: ${error.message}`);
    } finally {
        clearTimeout(timeout);
    }

    if (!response.ok) {
        const providerError = payload?.error;
        const providerMessage = providerError?.message || lastRateLimitMessage || `HTTP ${response.status}`;
        const providerCode = providerError?.code ? ` [code ${providerError.code}]` : '';
        const providerMetadata = providerError?.metadata?.raw
            ? ` (${providerError.metadata.raw})`
            : '';
        throw new Error(
            `ChatGPT/OpenRouter request failed: ${providerMessage}${providerCode}${providerMetadata}`
        );
    }
    const messageContent = payload?.choices?.[0]?.message?.content;
    const text = Array.isArray(messageContent)
        ? messageContent
            .filter(part => part?.type === 'text' && typeof part.text === 'string')
            .map(part => part.text)
            .join('')
        : messageContent;
    if (typeof text !== 'string' || !text.trim()) {
        throw new Error('ChatGPT/OpenRouter returned an empty response.');
    }

    conversationHistory.set(historyKey, [
        ...history,
        { role: 'user', content: message },
        { role: 'assistant', content: text }
    ].slice(-MAX_HISTORY_MESSAGES));
    return text;
}

export function clearConversationHistory(userId) {
    conversationHistory.delete(getHistoryKey(userId, 'gemini'));
    conversationHistory.delete(getHistoryKey(userId, 'nvidia'));
    conversationHistory.delete(getHistoryKey(userId, 'openai'));
}
