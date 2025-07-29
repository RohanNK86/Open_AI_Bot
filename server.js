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
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('yoo')) {
    return 'Hello! How can I help you today?';
  } 
  else if (msg.includes('how are you')) {
    return "I'm just a bot, but I'm doing great! What about you?";
  } 
  else if (msg.includes('who built you')){
    return "I was built by a genius student from MS Ramaiah Institute of Technology, His Name is Rohan";
  } 
  else if (msg.includes('what all you can do for me')){
    return "Tell Rohan to feed and add more features to me, so that i can do anything for you!";
  } 
  else if (msg.includes('bye')) {
    return '🙋‍♂️Goodbye! Have a nice day!';
  } 
  else if (msg.includes('i am fine')) {
    return "😊That's great to hear!";
  } 
  else if (msg.includes('why you were created') || msg.includes('why you were developed')) {
    return "😀Soon You'll get to know when i will bring a revolutionary changes!";
  }
   else if (msg.includes("who is rohan's gf")) {
    return "🤫 Alright i will tell about it, She is very cute and beautiful and rohan truly love's her but she doest'nt know about this, I wish she will accept his proposal and marry him, cause he will take care her as a little princes";
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