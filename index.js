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

const topic = "Twitter-Kafka";
// const topic = "FederatedPosts";

async function runConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: topic, fromBeginning: true });

  // receiving the kafka messages
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
        try {
            const data = JSON.parse(message.value.toString());
            console.log('Received Message:', data);
            handleTwitterPosts(data);
        } catch {
            console.error('Error processing post', error);
        }
    },
  });
}

// 1. Text field
// 2. HASHTAG
// insert this into our table
// is data parseable?
// check if texts / posts are undefined ;; if any are not, don't consider it
async function handleTwitterPosts(data) {
    try {
        console.log('Processing Twitter post:', data);
        // extract the hashtags / text content from the posts in the stream 
        const text = data.text;
        const hashtags = data.hashtags;

        // if (text == undefined || hashtags == undefined) {
        //     throw error;
        // }

        // insert the post with a placeholder author_id for Twitter users in both `posts` and `texts` tables
        const insertPostQuery = `
            INSERT INTO posts (author_id, title, content, parent_post, timestamp)
            VALUES (-1, '', ?, 'null', NOW());`;
        const postResult = await dbAccess.send_sql(insertPostQuery, [text]);
        const postId = postResult.insertId;

        // insert post into `texts` table
        const insertTextQuery = `
            INSERT INTO texts (author_id, content, timestamp, post_id)
            VALUES (-1, ?, NOW(), ?);`;
        await dbAccess.send_sql(insertTextQuery, [text, postId]);

        // check / handle hashtags
        if (hashtags && hashtags.length > 0) {
            await Promise.all(hashtags.map(async (hashtag) => {
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
            }));
        }
        console.log('Twitter post processed successfully with hashtags and inserted into texts table.');
    } catch (error) {
        console.error('Error processing Twitter post:', error);
    }
}

// similar to twitter, handle federated posts 
async function handleFederatedPosts(data) {
    try {
        // TODO PUT SOMETHING HERE 
    } catch {
        console.error('Error processing federated post:', error);
    }
}

// this is the format we have to follow here
// {
//     username: '...',
//     source_site: '...',
//     post_uuid_within_site: '...',
//     post_text: '...',
//     content_type: '...'
// }
// when we send to kafka, we follow a very specific format
// fix this to follow format

async function sendPostToKafka(post, producer, topic) {
    try {
        await producer.connect();
        // for post to match the required Kafka message structure
        const kafkaMessage = {
            username: post.author_id,
            source_site: 'g01',
            post_uuid_within_site: post.uuid,
            post_text: post.content,
            content_type: 'text/plain'
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



// this is for RECEIVING POSTS!!!
// check for text + hashtag
// insert a new post into table w/ placeholder values (only care about text + hashtag)
// when inserting, just create a new author id (= -1) for twitter user 
// now we have posts/hashtag table, we need to check for the existence of the hashtag table
// first check if hashtag exists, if it does, then get the id of the hashtag then just add to post hashtag table
// if does not exist, then add hashtag into the table, and new post/hashtag relationship into the other table

// https://edstem.org/us/courses/49842/discussion/4809058