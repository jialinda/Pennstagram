const express = require('express');
const session = require('express-session');
const cors = require('cors');
const registry = require('./routes/register_routes');
//const { Chroma } = require("@langchain/community/vectorstores/chroma");


const app = express();

// Middleware setup
app.use(cors({
  origin: 'http://localhost:4567',
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
