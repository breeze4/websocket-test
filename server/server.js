const WebSocket = require('ws');
const crypto = require('crypto');

// Create WebSocket server on port 8080
const server = new WebSocket.Server({ port: 8080 }, () => {
  console.log('WebSocket server is listening on ws://localhost:8080');
});

server.on('connection', (socket) => {
  console.log('New client connected');

  let sequenceNumber = 0;

  // Function to generate random message
  const generateMessage = () => {
    const uniqueId = crypto.randomUUID();
    sequenceNumber++;
    const randomText = crypto.randomBytes(1024).toString('hex').slice(0, 1024);
    return {
      uniqueId,
      sequenceNumber,
      randomText,
    };
  };

  // Function to send messages with controlled frequency
  const sendMessages = () => {
    if (socket.readyState === WebSocket.OPEN) {
      const message = generateMessage();
      socket.send(JSON.stringify(message), (err) => {
        if (err) {
          console.error('Failed to send message:', err);
        } else {
          setImmediate(sendMessages); // Schedule the next message
        }
      });
    }
  };

  // Start sending messages
  setImmediate(sendMessages);

  // Handle client disconnection
  socket.on('close', () => {
    console.log('Client disconnected');
  });
});
