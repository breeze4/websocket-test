let socket = null;
const messagesList = document.getElementById('messages');
let lastMessageTime = null;

const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const statsDisplay = document.getElementById('stats');
const requestMessagesButton = document.createElement('button');
requestMessagesButton.textContent = 'Request 1000 Messages';
document.body.insertBefore(requestMessagesButton, messagesList);

let renderTimes = [];
let messageCount = 0;
let startTime = null;
let messageRates = [];

// Start WebSocket connection
startButton.addEventListener('click', () => {
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    socket = new WebSocket('ws://localhost:8080');
    startTime = new Date();
    messageCount = 0;
    renderTimes = [];
    messageRates = [];

    // Handle incoming messages
    socket.onmessage = (event) => {
      const renderStartTime = performance.now();

      const message = JSON.parse(event.data);
      const listItem = document.createElement('li');
      listItem.className = 'message';

      // Calculate time difference
      const currentTime = new Date();
      let timeDifference = '';
      if (lastMessageTime) {
        timeDifference = `, Time since last message: ${(currentTime - lastMessageTime)} milliseconds`;
      }
      lastMessageTime = currentTime;

      listItem.textContent = `ID: ${message.uniqueId}, Sequence: ${message.sequenceNumber}, Text: ${message.randomText}${timeDifference}`;

      // Insert the new message at the top of the list
      if (messagesList.firstChild) {
        messagesList.insertBefore(listItem, messagesList.firstChild);
      } else {
        messagesList.appendChild(listItem);
      }

      // Limit the number of messages to 1000
      if (messagesList.childElementCount > 1000) {
        messagesList.removeChild(messagesList.lastChild);
      }

      const renderEndTime = performance.now();
      const renderTime = renderEndTime - renderStartTime;
      renderTimes.push(renderTime);
      messageCount++;
      // enable for all rendering shown if needed, too noisy with a high rate
      // console.log(`Message render time: ${renderTime.toFixed(2)} ms`);

      // Update stats display
      updateStats();
    };

    socket.onopen = () => {
      console.log('WebSocket connection opened');
    };

    socket.onclose = () => {
      const endTime = new Date();
      const duration = (endTime - startTime) / 1000;
      const messagesPerSecond = messageCount / duration;
      messageRates.push(messagesPerSecond);
      console.log(`WebSocket connection closed. Handled ${messageCount} messages in ${duration.toFixed(2)} seconds.`);
      console.log(`Messages per second: ${messagesPerSecond.toFixed(2)}`);
      logMessageRateStats();
      logRenderTimeStats();
    };
  }
});

// Stop WebSocket connection
stopButton.addEventListener('click', () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  }
});

// Request 1000 messages from HTTP server in 10 separate requests
requestMessagesButton.addEventListener('click', () => {
  messagesList.innerHTML = ''; // Clear existing messages
  const fetchStartTime = performance.now();
  let completedRequests = 0;
  const fetchRenderTimes = [];

  for (let i = 0; i < 10; i++) {
    fetch(`http://localhost:8081/messages`, { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
      .then(response => response.json())
      .then(data => {
        data.forEach((message) => {
          const renderStartTime = performance.now();
          const listItem = document.createElement('li');
          listItem.className = 'message';
          listItem.textContent = `ID: ${message.uniqueId}, Sequence: ${message.sequenceNumber}, Text: ${message.randomText}`;
          messagesList.appendChild(listItem);
          const renderEndTime = performance.now();
          const renderTime = renderEndTime - renderStartTime;
          fetchRenderTimes.push(renderTime);
          renderTimes.push(renderTime);
        });

        completedRequests++;
        if (completedRequests === 10) {
          const fetchEndTime = performance.now();
          console.log(`Fetched and rendered 1000 messages in ${(fetchEndTime - fetchStartTime).toFixed(2)} ms`);
          logFetchRenderStats(fetchRenderTimes);
          updateStats();
        }
      })
      .catch(error => {
        console.error('Error fetching messages:', error);
      });
  }
});

// Function to update render time statistics
function updateStats() {
  if (renderTimes.length > 0) {
    const minTime = Math.min(...renderTimes).toFixed(2);
    const maxTime = Math.max(...renderTimes).toFixed(2);
    const avgTime = (renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length).toFixed(2);
    statsDisplay.textContent = `Min Render Time: ${minTime} ms, Max Render Time: ${maxTime} ms, Avg Render Time: ${avgTime} ms`;
  }
}

// Function to log message rate statistics
function logMessageRateStats() {
  if (messageRates.length > 0) {
    messageRates.sort((a, b) => a - b);
    const p50 = percentile(messageRates, 50).toFixed(2);
    const p95 = percentile(messageRates, 95).toFixed(2);
    const p99 = percentile(messageRates, 99).toFixed(2);
    console.log(`Message Rates - P50: ${p50} messages/sec, P95: ${p95} messages/sec, P99: ${p99} messages/sec`);
  }
}

// Function to log render time statistics
function logRenderTimeStats() {
  if (renderTimes.length > 0) {
    renderTimes.sort((a, b) => a - b);
    const p50 = percentile(renderTimes, 50).toFixed(2);
    const p95 = percentile(renderTimes, 95).toFixed(2);
    const p99 = percentile(renderTimes, 99).toFixed(2);
    console.log(`Render Times - P50: ${p50} ms, P95: ${p95} ms, P99: ${p99} ms`);
  }
}

// Function to log fetch render time statistics
function logFetchRenderStats(fetchRenderTimes) {
  if (fetchRenderTimes.length > 0) {
    fetchRenderTimes.sort((a, b) => a - b);
    const p50 = percentile(fetchRenderTimes, 50).toFixed(2);
    const p95 = percentile(fetchRenderTimes, 95).toFixed(2);
    const p99 = percentile(fetchRenderTimes, 99).toFixed(2);
    console.log(`Fetch Render Times - P50: ${p50} ms, P95: ${p95} ms, P99: ${p99} ms`);
  }
}

// Function to calculate percentile
function percentile(arr, p) {
  const index = Math.ceil((p / 100) * arr.length) - 1;
  return arr[index];
}
