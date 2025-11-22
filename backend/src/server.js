const app = require('./app');
const http = require('http');
const socketIo = require('socket.io');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true
  }
});

// Store connected users
const connectedUsers = {};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔗 New WebSocket connection:', socket.id);

  // Register user - listen for 'register_user' event
  socket.on('register_user', (userData) => {
    const { userId, role, name } = userData;
    
    // Remove old registration if this socket was previously registered to another user
    for (const oldUserId in connectedUsers) {
      if (connectedUsers[oldUserId].socketId === socket.id && oldUserId !== userId) {
        console.log(`🔄 Socket ${socket.id} was registered to ${connectedUsers[oldUserId].name}, now switching to ${name}`);
        delete connectedUsers[oldUserId];
      }
    }
    
    connectedUsers[userId] = {
      socketId: socket.id,
      role,
      name
    };
    console.log(`✅ User registered: ${name} (${role}) - Socket: ${socket.id}`);
    console.log(`📊 Total connected users: ${Object.keys(connectedUsers).length}`);
    console.log('👥 Active users:', Object.keys(connectedUsers).map(id => `${connectedUsers[id].name} (${connectedUsers[id].role})`));
    
    // Send confirmation back to user
    socket.emit('registration_confirmed', {
      message: `Welcome ${name}! You are now connected.`,
      userId,
      role
    });
    
    // Send a test notification to verify connection
    console.log(`🧪 Sending test notification to ${name} on socket ${socket.id}`);
    socket.emit('test_connection', {
      message: `Connection test for ${name}`,
      timestamp: new Date().toISOString()
    });
  });

  // Also listen for old 'register' event for backward compatibility
  socket.on('register', (userData) => {
    const { userId, role, name } = userData;
    connectedUsers[userId] = {
      socketId: socket.id,
      role,
      name
    };
    console.log(`✅ User registered: ${name} (${role}) - Socket: ${socket.id}`);
    console.log(`📊 Total connected users: ${Object.keys(connectedUsers).length}`);
    
    socket.emit('registration_confirmed', {
      message: `Welcome ${name}! You are now connected.`,
      userId,
      role
    });
  });

  // Test notification handler for debugging
  socket.on('test_notification', (data) => {
    console.log('🧪 Test notification received:', data);
    socket.emit('appointment_notification', {
      type: 'test',
      message: 'Test notification from server',
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Remove user from connected users
    for (const userId in connectedUsers) {
      if (connectedUsers[userId].socketId === socket.id) {
        console.log(`❌ User disconnected: ${connectedUsers[userId].name}`);
        delete connectedUsers[userId];
        break;
      }
    }
    console.log(`📊 Remaining connected users: ${Object.keys(connectedUsers).length}`);
  });
});

// Make io accessible to other modules
app.set('io', io);
app.set('connectedUsers', connectedUsers);

server.listen(PORT, () => {
  console.log(`🚀 CuraSync Hospital API Server running on port ${PORT}`);
  console.log(`📊 Health check available at: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.IO server initialized`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = server;