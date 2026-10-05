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
    'Ãƒâ€”': '×'
};

for (const [mojibake, emoji] of Object.entries(replacements)) {
    content = content.split(mojibake).join(emoji);
}

// Enhance CSS for a premium AI startup look
content = content.replace(/background: linear-gradient\(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%\);/g, 'background: #000000;');
content = content.replace(/background: rgba\(15, 15, 15, 0.8\);/g, 'background: rgba(0, 0, 0, 0.7);');
content = content.replace(/background: linear-gradient\(135deg, #667eea 0%, #764ba2 100%\);/g, 'background: #ffffff; color: #000000;');
content = content.replace(/background: linear-gradient\(135deg, #f093fb 0%, #f5576c 100%\);/g, 'background: #333333; color: #ffffff;');
content = content.replace(/background: rgba\(102, 126, 234, 0.15\);/g, 'background: #2a2a2a; color: #ffffff;');
content = content.replace(/border: 1px solid rgba\(102, 126, 234, 0.3\);/g, 'border: 1px solid rgba(255, 255, 255, 0.1);');
content = content.replace(/color: #667eea;/g, 'color: #ffffff;');
content = content.replace(/-webkit-text-fill-color: transparent;/g, '');
content = content.replace(/-webkit-background-clip: text;/g, '');
content = content.replace(/background-clip: text;/g, '');

// Simplify logo SVG
const logoRegex = /<svg viewBox="0 0 200 200" xmlns="http:\/\/www.w3.org\/2000\/svg">[\s\S]*?<\/svg>/;
const premiumLogo = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="white"/></svg>`;
content = content.replace(logoRegex, premiumLogo);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed index.html successfully.');
