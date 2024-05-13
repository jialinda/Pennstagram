const express = require('express');
const { Kafka } = require('kafkajs');
const config = require('./config.json');
const dbAccess = require('./models/db_access');
const registry = require('./routes/register_routes');
const session = require('express-session');
const cors = require('cors');
const SnappyCodec = require('kafkajs-snappy');
const { CompressionTypes, CompressionCodecs } = require('kafkajs');


CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: config.kafka.bootstrapServers
});

const consumer = kafka.consumer({ groupId: config.kafka.groupId });
const producer = kafka.producer();

const topic1 = "Twitter-Kafka";
const topic2 = "FederatedPosts";

async function runConsumer() {
    try {
        console.log('Database successfully connected.');
        await consumer.connect();
        await consumer.subscribe({ topics: [topic1, topic2], fromBeginning: true });
        console.log('Kafka consumer connected and subscribed.');

        consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                console.log(`Received message from ${topic}: ${message.value.toString()}`);
                try {
                    const data = JSON.parse(message.value.toString());
                    if (topic === topic1) { 
                        console.log('Processing Twitter post:', data);
                        await handleTwitterPosts(data);
                    } else if (topic === topic2) {
                        console.log('Processing Federated post:', data);
                        await handleFederatedPosts(data);
                    }
                    await consumer.commitOffsets([{ topic, partition, offset: (message.offset + 1).toString() }]);
                } catch (err) {
                    console.error('Error processing message:', err);
                }
            }
        });
    } catch (error) {
        console.error('Error during startup:', error);
    }
}


// 1. Text field
// 2. HASHTAG
// insert this into our table
// is data parseable?
// check if texts / posts are undefined ;; if any are not, don't consider it
async function handleTwitterPosts(data) {
    try {
        console.log('Processing Twitter post:', data);
        const text = data.text;
        const hashtags = data.hashtags || [];

        if (!text) {
            console.log('Error processing Twitter post: text is undefined.');
            return;
        }
        const insertPostQuery = `
            INSERT INTO posts (author_id, title, content, parent_post, timestamp)
            VALUES (-1, '', ?, NULL, NOW());
        `;
        const postResult = await dbAccess.send_sql(insertPostQuery, [text]);
        const postId = postResult.insertId;
        console.log(`Post inserted with ID: ${postId}`);

        for (const rawHashtag of hashtags) {
            const hashtag = rawHashtag.startsWith('#') ? rawHashtag : `#${rawHashtag}`;

            let tagId;
            const tagCheckQuery = `SELECT hashtag_id FROM hashtags WHERE hashtagname = ?;`;
            const tagCheckResult = await dbAccess.send_sql(tagCheckQuery, [hashtag]);
            if (tagCheckResult.length > 0) {
                tagId = tagCheckResult[0].hashtag_id;
            } else {
                const tagInsertQuery = `INSERT INTO hashtags (hashtagname) VALUES (?);`;
                const tagInsertResult = await dbAccess.send_sql(tagInsertQuery, [hashtag]);
                tagId = tagInsertResult.insertId;
            }
            const postTagRelationQuery = `INSERT INTO post_tagged_with (post_id, hashtag_id) VALUES (?, ?);`;
            await dbAccess.send_sql(postTagRelationQuery, [postId, tagId]);
        }

        console.log('Twitter post processed successfully with hashtags and inserted into texts table.');
    } catch (error) {
        console.error('Error processing Twitter post:', error);
        console.error(`Failed operation data: ${JSON.stringify(data)}`);
    }
}

// federated posts
async function handleFederatedPosts(data) {
    try {
        console.log('Processing Federated post:', data);
        const post_text = data.post_text;
        const content_type = data.content_type;

        if (!post_text) {
            throw new Error('Post text is undefined or empty');
        }

        const author_id = -1; // Use a consistent author ID for federated posts

        // Regular expression to find hashtags
        const hashtagRegex = /#(\w+)/g;
        let match;
        const hashtags = [];
        while ((match = hashtagRegex.exec(post_text)) !== null) {
            hashtags.push(`#${match[1]}`);
        }

        // Insert the post into the database
        const insertPostQuery = `
            INSERT INTO posts (title, content, author_id, timestamp)
            VALUES (?, ?, ?, NOW());
        `;
        const postResult = await dbAccess.send_sql(insertPostQuery, ['', post_text, author_id]);
        const postId = postResult.insertId;
        console.log(`Federated post inserted with ID: ${postId}`);

        // Handle each hashtag found in the post text
        for (const hashtag of hashtags) {
            let tagId;
            const tagCheckQuery = `SELECT hashtag_id FROM hashtags WHERE hashtagname = ?;`;
            const tagCheckResult = await dbAccess.send_sql(tagCheckQuery, [hashtag]);
            if (tagCheckResult.length > 0) {
                tagId = tagCheckResult[0].hashtag_id;
            } else {
                const tagInsertQuery = `INSERT INTO hashtags (hashtagname) VALUES (?);`;
                const tagInsertResult = await dbAccess.send_sql(tagInsertQuery, [hashtag]);
                tagId = tagInsertResult.insertId;
            }
            const postTagRelationQuery = `INSERT INTO post_tagged_with (post_id, hashtag_id) VALUES (?, ?);`;
            await dbAccess.send_sql(postTagRelationQuery, [postId, tagId]);
        }

        console.log('Federated post processed successfully with hashtags and inserted into texts table.');
    } catch (error) {
        console.error('Error processing Federated post:', error);
    }
}







async function sendPostToKafka(post, producer, topic) {
    try {
        await producer.connect();
        // for post to match the required Kafka message structure
        const kafkaMessage = {
            username: post.author_id,
            source_site: 'g07',
            post_uuid_within_site: post.uuid,
            post_text: post.content,
            content_type: 'testing please work!!!!!!!!!!!!!!!!!!!!!!! '
        };
        // prepare message for Kafka
        const messages = [{ value: JSON.stringify(kafkaMessage) }];
        await producer.send({ topic, messages });
        console.log('Post sent to Kafka:', kafkaMessage);
    } catch (error) {
        console.error('Error sending post to Kafka:', error);
    }
}

runConsumer().catch(error => console.error('Error in Kafka Consumer:', error));

module.exports = sendPostToKafka;