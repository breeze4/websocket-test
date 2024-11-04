const dgram = require('dgram');

// Configuration
const STATSD_HOST = 'localhost';
const STATSD_PORT = 8125;

// Create UDP socket

// Metric to send
const metric = 'my_app.metric:1|c';

const INTERVAL_MS = 500;

const sendMetric = () => {
  const client = dgram.createSocket('udp4');
  client.send(metric, 0, metric.length, STATSD_PORT, STATSD_HOST, (err) => {
    if (err) {
      console.error('Error sending metric:', err);
    } else {
      console.log('Metric sent successfully');
    }
    client.close();
  });
  setTimeout(sendMetric, INTERVAL_MS)
}

sendMetric()


