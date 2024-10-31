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
          setTimeout(sendMessagesWithSetTimeout, 0); // Schedule the next message after 10ms
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
