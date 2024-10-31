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

  // Send a message to the client every 2 seconds
  const intervalId = setInterval(() => {
    const message = generateMessage();
    socket.send(JSON.stringify(message));
  }, 100);

  // Handle client disconnection
  socket.on('close', () => {
    console.log('Client disconnected');
    clearInterval(intervalId);
  });
});
