const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    socket.emit('me', socket.id);

    // When a user disconnects
    socket.on('disconnect', () => {
      socket.broadcast.emit('callEnded');
    });

    // When the doctor/patient initiates a call
    socket.on('callUser', ({ userToCall, signalData, from, name }) => {
      io.to(userToCall).emit('callUser', { signal: signalData, from, name });
    });

    // When the called user answers
    socket.on('answerCall', (data) => {
      io.to(data.to).emit('callAccepted', data.signal);
    });

    // Optional: for joining a specific room linked to an appointment ID
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      const clientsInRoom = io.sockets.adapter.rooms.get(roomId);
      const numClients = clientsInRoom ? clientsInRoom.size : 0;
      
      if (numClients === 1) {
        socket.emit('roomCreated', roomId);
      } else if (numClients === 2) {
        socket.emit('roomJoined', roomId);
        // Alert the other user that someone joined
        socket.to(roomId).emit('ready', roomId);
      } else {
        socket.emit('roomFull', roomId);
      }
    });
  });
};

module.exports = { initializeSocket };
