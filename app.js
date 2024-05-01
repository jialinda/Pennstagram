// const express = require('express');
// const { Kafka } = require('kafkajs');
// const session = require('express-session');
// const cors = require('cors');

// const app = express();
// const port = 8080;

// // Kafka configuration
// var config = require('./config.json');
// const kafka = new Kafka({
//     clientId: 'stream-team',
//     brokers: config.bootstrapServers
// });

// const consumer = kafka.consumer({ groupId: config.groupId });

// var kafka_messages = [];

// app.use(cors({
//   origin: 'http://localhost:4567',
//   methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
//   credentials: true
// }));
// app.use(express.json());
// app.use(session({
//   secret: 'nets2120_insecure', saveUninitialized: true, cookie: { httpOnly: false }, resave: true
// }));

// // kafka consumer
// const run = async () => {
//     await consumer.connect();
//     await consumer.subscribe({ topic: config.topic, fromBeginning: true });

//     await consumer.run({
//         eachMessage: async ({ topic, partition, message }) => {
//             kafka_messages.push({
//                 value: message.value.toString(),
//             });
//             console.log({
//                 value: message.value.toString(),
//             });
//         },
//     });
// };

// run().catch(console.error);

// // routes
// app.get('/', (req, res) => {
//     res.send(JSON.stringify(kafka_messages));
// });

// // register other routes
// const registry = require('./routes/register_routes.js');
// registry.register_routes(app);

// // start server
// app.listen(port, () => {
//   console.log(`Main app listening on port ${port}`)
// });


const express = require('express');
const app = express();
const port = 8080;
const registry = require('./routes/register_routes.js');
const session = require('express-session');
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:4567',
  methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: 'nets2120_insecure', saveUninitialized: true, cookie: { httpOnly: false }, resave: true
}));


registry.register_routes(app);

app.listen(port, () => {
  console.log(`Main app listening on port ${port}`)
})