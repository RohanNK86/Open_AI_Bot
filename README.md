# Super ChatBot

A modern web-based chatbot application powered by OpenAI's GPT-3.5-turbo.

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set up OpenAI API Key
1. Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Set your API key as an environment variable:
```bash
export OPENAI_API_KEY=your_actual_api_key_here
```

### 3. Run the Application
```bash
python main.py
```

### 4. Access the Application
Open your browser and go to: `http://127.0.0.1:5000`

## Features
- Real-time chat with GPT-3.5-turbo
- Pro user features (demo mode)
- Chat history (Pro users)
- File attachments (Pro users)
- Modern UI with responsive design

## Troubleshooting
- If you see "Error connecting to server", make sure the Flask server is running
- If you see API key errors, check that your OPENAI_API_KEY environment variable is set
- Make sure you have a valid OpenAI API key with sufficient credits 