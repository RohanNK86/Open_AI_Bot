# Super ChatBot

A modern web-based chatbot application powered by OpenAI's GPT-3.5-turbo.

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set up OpenAI API Key
1. Get your Gemini API key from [Gemini API Platform] https://www.google.com/aclk?sa=L&ai=DChsSEwj4h_LqyKuQAxUchUsFHVmTAjYYACICCAEQABoCc2Y&ae=2&co=1&ase=2&gclid=CjwKCAjw0sfHBhB6EiwAQtv5qfPIrdhb97vaXZAXVFhMC2WFJ4cltq--tqtP7CQBxQ0HIKPG6y5SfBoCcNYQAvD_BwE&ei=aGPyaJvwJajuseMP-N_mgQI&cid=CAASlwHkaEqjIBAEiHwS23pvzgo_gdyrdicJiQ0Dl1UjMOqB5gjeykfrif1QU6FDrq0rhOx11mn8Z4VhBISAhIRiw9kBZNSd7DTj_Ja1kqfyCb_gAVPInLU5bZJHCax-Q2GdNC-EE_UW58KMntEctJ56k7dO56e1GpNYrLEfdqK6WhVF2w315sv-9R2pAw5DtjHptoC8Bc74gJht&cce=2&category=acrcp_v1_71&sig=AOD64_0MKL0GEBf4LLB_Kt0C1bB3Q1IHUQ&q&sqi=2&nis=4&adurl&ved=2ahUKEwibxOzqyKuQAxUod2wGHfivOSAQ0Qx6BAgWEAE
2. Set your API key as an environment variable:
```bash
export GEMINI_API_KEY=your_actual_api_key_here
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

API Keys = PMAK-68b1e17c48c3cf0001046316-3def08fd2ddcb0f7e357928d75a546e464
