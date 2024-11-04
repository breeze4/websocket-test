const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let wsMessages = [];
let sequenceNumber = 0;

// Function to generate random message
const generateMessage = () => {
  const uniqueId = crypto.randomUUID();
  const randomText = crypto.randomBytes(1024).toString('hex').slice(0, 1024);
  const message = {
    uniqueId,
    sequenceNumber,
    randomText,
  };
  sequenceNumber++
  if (wsMessages.length >= 10000) {
    wsMessages.shift(); // Remove the oldest message to maintain the limit of 10000
  }
  wsMessages.push(message);
  return message;
};

wss.on('connection', (socket) => {
  console.log('New client connected');

  // Function to send messages using setImmediate (high frequency)
  const sendMessagesWithSetImmediate = () => {
    if (socket.readyState === WebSocket.OPEN) {
      const message = generateMessage();
      socket.send(JSON.stringify(message), (err) => {
        if (err) {
          console.error('Failed to send message:', err);
        } else {
          setImmediate(sendMessagesWithSetImmediate); // Schedule the next message
        }
      });
    }
  };

  // Function to send messages using setTimeout (controlled frequency)
  const sendMessagesWithSetTimeout = () => {
    if (socket.readyState === WebSocket.OPEN) {
      const message = generateMessage();
      socket.send(JSON.stringify(message), (err) => {
        if (err) {
          console.error('Failed to send message:', err);
        } else {
          setTimeout(sendMessagesWithSetTimeout, 0); // Schedule the next message after 0ms
        }
      });
    }
  };

  // Choose which approach to use: setImmediate or setTimeout
  const useSetImmediate = true; // Set to false to use setTimeout instead

  if (useSetImmediate) {
    setImmediate(sendMessagesWithSetImmediate);
  } else {
    setTimeout(sendMessagesWithSetTimeout, 0);
  }

  // Handle client disconnection
  socket.on('close', () => {
    wsMessages = [];
    sequenceNumber = 0;
    console.log('Client disconnected');
  });
});

// Handle GET request for messages and serve HTML/JS files
app.get('/messages', (req, res) => {
  // Generate 1000 new messages when requested
  const messages = [];
  for (let i = 0; i < 1000; i++) {
    messages.push(generateMessage());
  }
  res.json(messages);
  sequenceNumber = 0;
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/client.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'client.js'));
});

// Start the server
server.listen(8081, () => {
  console.log('HTTP and WebSocket server is listening on http://localhost:8081');
});
