const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.static('public'));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

io.on('connection', (socket) => {
  console.log(`Kullanıcı bağlandı: ${socket.id}`);

  socket.join('p2p-video-room');
  console.log(`${socket.id} odaya katıldı`);

  socket.to('p2p-video-room').emit('peer-joined', socket.id);

  socket.on('sdp-offer', (data) => {
    console.log(`sdp-offer: ${socket.id} -> ${data.targetId}`);
    socket.to(data.targetId).emit('sdp-offer', data);
  });

  socket.on('sdp-answer', (data) => {
    console.log(`sdp-answer: ${socket.id} -> ${data.targetId}`);
    socket.to(data.targetId).emit('sdp-answer', data);
  });

  socket.on('ice-candidate', (data) => {
    console.log(`ice-candidate: ${socket.id} -> ${data.targetId}`);
    socket.to(data.targetId).emit('ice-candidate', data);
  });

  socket.on('segment_ready', (data) => {
    console.log(`Segment alındı: ${socket.id} -> Parça ${data.sn}`);
  });

  socket.on('disconnect', () => {
    console.log(`Kullanıcı ayrıldı: ${socket.id}`);
    socket.to('p2p-video-room').emit('peer-left', socket.id);
  });
});

server.listen(3000);
