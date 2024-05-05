const express = require('express');
// everything related to Kafka is from the repo provided here: https://github.com/upenn-nets-2120/basic-kafka-client/blob/main/app.js
const { Kafka } = require('kafkajs');
var config = require('./config.json');

const app = express();

// set up kafka client
const kafka = new Kafka({
  clientId: 'my-app',
  brokers: config.bootstrapServers
});

// set up kafka consumer
const consumer = kafka.consumer({ 
  groupId: config.groupId, 
  bootstrapServers: config.bootstrapServers});

var kafka_messages = [];

app.get('/', (req, res) => {
    res.send(JSON.stringify(kafka_messages));
});

const run = async () => {
  // Consuming
  await consumer.connect();
  console.log(`Following topic ${config.topic}`);
  await consumer.subscribe({ topic: config.topic, fromBeginning: true });

  await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
          kafka_messages.push({
              value: message.value.toString(),
          });
          console.log({
              value: message.value.toString(),
          });
      },
  });
};

run().catch(console.error);

app.listen(config.port, () => {
  console.log(`App is listening on port ${config.port} -- you can GET the Kafka messages`);
});

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