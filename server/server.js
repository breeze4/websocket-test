const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');

// Create WebSocket server on port 8080
const server = new WebSocket.Server({ port: 8080 }, () => {
  console.log('WebSocket server is listening on ws://localhost:8080');
});

let messages = [];

server.on('connection', (socket) => {
  console.log('New client connected');

  let sequenceNumber = 0;

  // Function to generate random message
  const generateMessage = () => {
    const uniqueId = crypto.randomUUID();
    sequenceNumber++;
    const randomText = crypto.randomBytes(1024).toString('hex').slice(0, 1024);
    const message = {
      uniqueId,
      sequenceNumber,
      randomText,
    };
    if (messages.length >= 10000) {
      messages.shift(); // Remove the oldest message to maintain the limit of 10000
    }
    messages.push(message);
    return message;
  };

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
    console.log('Client disconnected');
  });
});

// Create HTTP server to handle GET request for messages
const httpServer = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/messages') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(messages));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

httpServer.listen(8081, () => {
  console.log('HTTP server is listening on http://localhost:8081');
});
