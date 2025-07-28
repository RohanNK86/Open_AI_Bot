const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use('/static', express.static(path.join(__dirname, 'static')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// Simple rule-based chatbot logic
function getBotReply(message) {
  const msg = message.toLowerCase();
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return 'Hello! How can I help you today?';
  } 
  else if (msg.includes('how are you')) {
    return "I'm just a bot, but I'm doing great! What about you?";
  } 
  else if (msg.includes('who built you')){
    return "I was built by a genius student from MS Ramaiah Institute of Technology, His Name is Rohan";
  } 
  else if (msg.includes('what all you can do for me')){
    return "I am still being developing by the Rohan, Need to get updates a lots of tools and technology";
  } 
  else if (msg.includes('bye')) {
    return 'Goodbye! Have a nice day!';
  } 
  else {
    return `You said: "${message}"`;
  }
}

app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  const reply = getBotReply(message);
  res.json({ reply });
});

app.listen(port, () => {
  console.log(`Chatbot server running at http://localhost:${port}`);
}); 