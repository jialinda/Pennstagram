///////////////
// NETS 2120 Sample Kafka Client
///////////////

const express = require('express');
const { Kafka } = require('kafkajs');
var config = require('./config.json');

const app = express();
// testing if brokers is not null 
console.log("Brokers: ", config.kafka.bootstrapServers);
const kafka = new Kafka({
    clientId: 'my-app',
    brokers: config.kafka.bootstrapServers
});

const consumer = kafka.consumer({ 
    groupId: config.kafka.groupId, 
    bootstrapServers: config.bootstrapServers});

var kafka_messages = [];

app.get('/', (req, res) => {
    res.send(JSON.stringify(kafka_messages));
});

const run = async () => {
    // Connecting and consuming
    await consumer.connect();
    console.log(`Following topic ${config.kafka.topic}`);
    await consumer.subscribe({ topic: config.kafka.topic, fromBeginning: true });

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

app.listen(config.serverPort, () => {
    console.log(`App is listening on port ${config.serverPort} -- you can GET the Kafka messages`);
});