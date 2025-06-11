// tcp_server.js
const net = require('net');

const HOST = '172.20.10.6';
const PORT = 3000;

function getTimestamp() {
  const now = new Date();
  return now.toTimeString().split(' ')[0]; // hh:mm:ss
}

const server = net.createServer((socket) => {
  const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`[CONNECT] Client connected: ${clientAddress}`);

  socket.on('data', (data) => {
    const raw = data.toString().trim();
    if (raw.length > 0) {
      const ts = getTimestamp();
      const message = raw.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/, '');
      console.log(`[${ts}] [RECEIVED] From ${clientAddress}: ${message}`);
    }
    socket.write(`Server received\n`);
  });

  socket.on('end', () => {
    console.log(`[DISCONNECT] Client disconnected: ${clientAddress}`);
  });

  socket.on('error', (err) => {
    console.error(`[ERROR] ${clientAddress}:`, err.message);
  });
});

server.on('error', (err) => {
  console.error('[SERVER ERROR]:', err);
});

server.listen(PORT, HOST, () => {
  console.log(`[START] TCP Server listening on ${HOST}:${PORT}`);
});
