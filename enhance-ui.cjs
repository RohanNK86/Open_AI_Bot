const fs = require('fs');

const filePath = 'templates/index.html';
let content = fs.readFileSync(filePath, 'utf-8');

const replacements = {
    'Ã¢Â­Â ': '⭐',
    'Ã°Å¸Å¡Âª': '🚪',
    'Ã°Å¸â€˜â€¹': '👋',
    'Ã°Å¸â€ Â¬': '🔬',
    'Ã¢Å“Â Ã¯Â¸Â ': '✍️',
    'Ã°Å¸â€™Â»': '💻',
    'Ã¢Å“Ë†Ã¯Â¸Â ': '✈️',
    'Ã°Å¸â€œÅ“': '📜',
    'Ã°Å¸â€“Â¼Ã¯Â¸Â ': '🖼️',
    'Ã°Å¸â€œÅ½': '📎',
    'Ã°Å¸Å½Â¤': '🎤',
    'Ã°Å¸Å¡â‚¬': '🚀',
    'Ã°Å¸â€™Â¾': '💾',
    'Ã°Å¸â€œÂ ': '📊',
    'Ã°Å¸â€ Â ': '🔍',
    'Ã°Å¸â€˜Â¤': '👤',
    'Ã°Å¸Â¤â€“': '🤖',
    'Ãƒâ€”': '×',
    'Ã¢Å¾Â¤': '➤',
    'Ã°Å¸â€œâ€ž': '📄'
};

for (const [mojibake, emoji] of Object.entries(replacements)) {
    content = content.split(mojibake).join(emoji);
}

const newStyles = `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #000000;
            color: #ECECEC;
            height: 100vh;
            display: flex;
            justify-content: center;
        }
        .container {
            width: 100%;
            max-width: 1200px;
            display: flex;
            flex-direction: column;
            height: 100%;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .logo { display: flex; align-items: center; gap: 12px; }
        .logo-icon svg { width: 28px; height: 28px; }
        .logo h1 { font-size: 18px; font-weight: 600; letter-spacing: 0.5px; }
        .header-controls { display: flex; gap: 12px; align-items: center; }
        
        button { font-family: 'Inter', sans-serif; cursor: pointer; border: none; outline: none; }
        .icon-btn, .pro-btn, .logout-btn {
            background: transparent;
            color: #A3A3A3;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 14px;
            transition: 0.2s;
        }
        .icon-btn:hover, .logout-btn:hover { background: #1A1A1A; color: #FFF; }
        .pro-btn { background: #FFFFFF; color: #000000; font-weight: 500; }
        .pro-btn:hover { opacity: 0.9; }

        .chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 40px 15%;
            display: flex;
            flex-direction: column;
            gap: 32px;
        }
        .chat-container::-webkit-scrollbar { width: 8px; }
        .chat-container::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        
        .welcome-screen { text-align: center; margin-top: 10vh; }
        .welcome-screen h2 { font-size: 32px; font-weight: 600; margin-bottom: 12px; }
        .welcome-screen p { color: #A3A3A3; margin-bottom: 48px; }
        
        .suggestion-cards {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            text-align: left;
        }
        .suggestion-card {
            background: #111111;
            border: 1px solid #222222;
            padding: 16px;
            border-radius: 12px;
            cursor: pointer;
            transition: 0.2s;
        }
        .suggestion-card:hover { background: #1A1A1A; border-color: #333; }
        .suggestion-card .icon { font-size: 20px; margin-bottom: 12px; }
        .suggestion-card h3 { font-size: 14px; margin-bottom: 4px; font-weight: 500; }
        .suggestion-card p { font-size: 13px; color: #888; }

        .message { display: flex; gap: 16px; animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .message.user { flex-direction: row-reverse; }
        
        .avatar {
            width: 36px; height: 36px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 18px;
            background: #111;
            border: 1px solid #333;
        }
        
        .message-content {
            padding: 12px 16px;
            border-radius: 12px;
            max-width: 75%;
            font-size: 15px;
            line-height: 1.6;
        }
        .message.user .message-content { background: #2A2A2A; color: #FFF; }
        .message.bot .message-content { background: transparent; color: #E5E5E5; padding-top: 6px; }
        
        .input-area { padding: 24px 15%; padding-bottom: 40px; }
        .input-wrapper {
            background: #1A1A1A;
            border: 1px solid #333;
            border-radius: 24px;
            display: flex;
            align-items: center;
            padding: 8px 16px;
            gap: 12px;
        }
        .input-wrapper:focus-within { border-color: #555; }
        
        .tool-buttons { display: flex; gap: 4px; }
        .tool-btn { background: transparent; font-size: 18px; color: #888; padding: 4px; border-radius: 8px; }
        .tool-btn:hover { color: #FFF; background: #2A2A2A; }
        
        .input-box { flex: 1; display: flex; align-items: center; }
        #input {
            width: 100%;
            background: transparent;
            border: none;
            color: #FFF;
            font-size: 15px;
            outline: none;
            resize: none;
            font-family: inherit;
        }
        
        .send-btn {
            background: #FFF;
            color: #000;
            width: 32px; height: 32px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 16px;
        }
        .send-btn:hover { opacity: 0.8; }
        
        .attachments-bar { display: flex; gap: 8px; margin-bottom: 12px; }
        .attachment-chip {
            background: #222; padding: 6px 12px; border-radius: 16px; font-size: 12px;
            display: flex; align-items: center; gap: 8px;
        }
        .attachment-chip .remove { color: #FF5555; cursor: pointer; font-size: 14px; }
        
        .typing-indicator span {
            display: inline-block; width: 6px; height: 6px;
            background: #888; border-radius: 50%; margin-right: 4px;
            animation: bounce 1.4s infinite;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); z-index: 100; align-items: center; justify-content: center; }
        .modal.active { display: flex; }
        .modal-content { background: #111; border: 1px solid #333; padding: 32px; border-radius: 16px; width: 400px; max-width: 90%; position: relative; }
        .modal-close { position: absolute; top: 16px; right: 16px; background: transparent; font-size: 24px; color: #888; }
        .modal-close:hover { color: #FFF; }
        .modal h2 { font-size: 20px; margin-bottom: 16px; }
        .pro-features { display: grid; gap: 12px; margin-bottom: 24px; }
        .feature-card { background: #1A1A1A; padding: 12px; border-radius: 8px; display: flex; align-items: center; gap: 12px; font-size: 14px; }
        
        input[type="file"] { display: none; }
        
        @media (max-width: 768px) {
            .chat-container, .input-area { padding-left: 20px; padding-right: 20px; }
            .suggestion-cards { grid-template-columns: 1fr; }
        }
    </style>
`;

content = content.replace(/<style>[\s\S]*?<\/style>/, newStyles);

const premiumLogo = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="white"/></svg>`;
content = content.replace(/<svg viewBox="0 0 200 200"[\s\S]*?<\/svg>/, premiumLogo);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('UI enhanced successfully.');
