const express = require('express');
const http = require('http'); // Required for integrating socket.io with Express
const socketIo = require('socket.io'); // Import socket.io
const app = express();
const server = http.createServer(app); // Create an HTTP server instance
const io = socketIo(server); // Attach socket.io to the HTTP server
// const { Chroma } = require("@langchain/community/vectorstores/chroma"); // call chroma

// const port = 8080;
const registry = require('./routes/register_routes.js');
const session = require('express-session');
const cors = require('cors');
// const registry = require('./routes/register_routes');


// Middleware setup
app.use(cors({
  origin: 'http://localhost:4567', // Adjust as needed for your front-end
  methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
  credentials: true
}));

app.use(express.json()); 

app.use(session({
  secret: 'nets2120_insecure', 
  saveUninitialized: true,
  cookie: { httpOnly: false },
  resave: true
}));


// Register routes
registry.register_routes(app);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const port = process.env.PORT || 8080;
console.log('io is in use');
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  // Example of handling a message event
  socket.on('sendMessage', (data) => {
    console.log('Message received: ', data);
    // Broadcast the message to all connected clients
    io.emit('receiveMessage', data);
  });

  // Additional event handlers can be added here
});

// Change app.listen to server.listen to start HTTP and WebSocket server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);;
});;

module.exports = app;
