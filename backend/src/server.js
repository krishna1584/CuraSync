const app = require('./app');
const http = require('http');
const socketIo = require('socket.io');
const User = require('./models/User');
const { verifyToken } = require('./utils/auth');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const { allowedOrigins } = require('./config/origins');

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Store connected users
const connectedUsers = {};

// Socket.IO connection handling
io.on('connection', (socket) => {
  // A socket only receives notifications after proving who it is with a valid JWT.
  // The user ID, role and name always come from the database, never from the client.
  socket.on('register_user', async (payload = {}) => {
    try {
      const token = typeof payload.token === 'string' ? payload.token : null;
      if (!token) throw new Error('Missing token');

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('name role');
      if (!user) throw new Error('User not found');

      const userId = user._id.toString();

      // Drop any previous registration held by this socket (e.g. after a user switch).
      for (const existingId in connectedUsers) {
        if (connectedUsers[existingId].socketId === socket.id && existingId !== userId) {
          delete connectedUsers[existingId];
        }
      }

      connectedUsers[userId] = { socketId: socket.id, role: user.role, name: user.name };
      socket.data.userId = userId;

      socket.emit('registration_confirmed', {
        message: `Welcome ${user.name}! You are now connected.`,
        userId,
        role: user.role
      });
    } catch (error) {
      socket.emit('registration_failed', { message: 'Authentication failed' });
    }
  });

  socket.on('disconnect', () => {
    const userId = socket.data.userId;
    if (userId && connectedUsers[userId] && connectedUsers[userId].socketId === socket.id) {
      delete connectedUsers[userId];
    }
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