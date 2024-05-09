const express = require('express');
const session = require('express-session');
const cors = require('cors');
const registry = require('./routes/register_routes');

const app = express();

// Middleware setup
app.use(cors({
  origin: function (origin, callback) {
    // List of allowed origins
    const allowedOrigins = ['http://localhost:4567', 'http://localhost:4568', 'http://localhost:4569', 'http://localhost:4570'];
    // Check if the incoming origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed from this origin'));
    }
  },
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
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
