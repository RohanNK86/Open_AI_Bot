import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini with better error handling
let model;
try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('Successfully initialized Gemini with model: gemini-1.5-flash');
} catch (error) {
    console.error('Failed to initialize Gemini:', error.message);
    console.log('Falling back to rule-based responses only');
}

// Conversation history storage
const conversationHistory = new Map();

// System prompt to guide the AI's behavior
const SYSTEM_PROMPT = `You are a helpful AI assistant created by Rohan, a student at MS Ramaiah Institute of Technology. 
You are talking to a user who is interacting with you through a chat interface. 
Be friendly, helpful, and concise in your responses.`;

// Add error handling for missing API key
if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY is not set in environment variables');
    console.log('Please make sure you have a .env file with GEMINI_API_KEY=your_api_key_here');
}

export async function generateResponse(userId, message) {
    // First, try to use the rule-based response
    const fallbackResponse = getFallbackResponse(message);

    // If we don't have a model initialized, return the fallback response
    if (!model) {
        console.log('Gemini model not initialized, using fallback response');
        return fallbackResponse;
    }

    try {
        // Initialize or get conversation history for this user
        if (!conversationHistory.has(userId)) {
            conversationHistory.set(userId, [
                { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
                { role: 'model', parts: [{ text: 'Hello! I\'m your AI assistant. How can I help you today?' }] }
            ]);
        }

        const history = conversationHistory.get(userId);

        // Add user message to history
        history.push({ role: 'user', parts: [{ text: message }] });

        try {
            // Generate response using Gemini
            const chat = model.startChat({
                history: history.slice(0, -1), // Exclude the current message from history
                generationConfig: {
                    maxOutputTokens: 1000,
                    temperature: 0.7,
                },
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            const text = response.text();

            // Add AI response to history
            history.push({ role: 'model', parts: [{ text }] });

            // Limit history to last 10 messages to manage context size
            if (history.length > 10) {
                conversationHistory.set(userId, history.slice(-10));
            }

            return text || fallbackResponse; // Return fallback if Gemini returns empty
        } catch (apiError) {
            console.error('Gemini API Error:', apiError.message);
            return fallbackResponse;
        }
    } catch (error) {
        console.error('Error in generateResponse:', error.message);
        return fallbackResponse;
    }
}

function getFallbackResponse(message) {
    const msg = message.toLowerCase();

    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('yoo')) {
        return 'Hello! How can I help you today?';
    }
    else if (msg.includes('how are you')) {
        return "I'm just a bot, but I'm doing great! What about you?";
    }
    else if (msg.includes('who built you')) {
        return "I was built by a genius student from MS Ramaiah Institute of Technology, His Name is Rohan";
    }
    else if (msg.includes('what all you can do for me')) {
        return "I can answer your questions, have conversations, and help with various tasks. I'm powered by Google's Gemini AI!";
    }
    else if (msg.includes('bye')) {
        return '🙋‍♂️Goodbye! Have a nice day!';
    }
    else if (msg.includes('i am fine')) {
        return "😊That's great to hear!";
    }
    else if (msg.includes('why you were created') || msg.includes('why you were developed')) {
        return "😀I was created to assist users with their questions and have meaningful conversations. I'm powered by Google's Gemini AI!";
    }
    else if (msg.includes("who is rohan's gf")) {
        return "🤫 That's a personal question! I respect everyone's privacy.";
    }
    return "I'm sorry, I'm having trouble understanding. Could you rephrase that?";
}

export function clearConversationHistory(userId) {
    if (conversationHistory.has(userId)) {
        conversationHistory.delete(userId);
    }
}
