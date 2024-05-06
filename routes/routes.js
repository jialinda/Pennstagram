const { OpenAI, ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { CheerioWebBaseLoader } = require("langchain/document_loaders/web/cheerio");

const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { Document } = require("@langchain/core/documents");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { formatDocumentsAsString } = require("langchain/util/document");
const {
    RunnableSequence,
    RunnablePassthrough,
} = require("@langchain/core/runnables");
// const { Chroma } = require("@langchain/community/vectorstores/chroma");
const AWS = require('aws-sdk');
const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const bcrypt = require('bcrypt');
const helper = require('../routes/route_helper.js');
var path = require('path');
const { ChromaClient } = require("chromadb");
const fs = require('fs');
// const tf = require('@tensorflow/tfjs-node');
const faceapi = require('@vladmandic/face-api');
const facehelper = require('../models/faceapp.js');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Temporary storage
const mysql = require('mysql2');
const client = new ChromaClient();
const parse = require('csv-parse').parse;
const csvContent = fs.readFileSync('/nets2120/project-stream-team/names.csv', 'utf8');




// AWS.config.update({
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     region: process.env.AWS_REGION
// });
// const s3 = new AWS.S3();

// Database connection setup
const db = dbsingleton;

var getHelloWorld = function (req, res) {
    res.status(200).send({ message: "Hello, world!" });
}


var getVectorStore = async function (req) {
    if (vectorStore == null) {
        vectorStore = await Chroma.fromExistingCollection(new OpenAIEmbeddings(), {
            collectionName: "imdb_reviews2",
            url: "http://localhost:8000", // Optional, will default to this value
        });
    }
    return vectorStore;
}


// POST /register 
var postRegister = async function (req, res) {
    if (!req.body.username || !req.body.password || !req.body.firstname || !req.body.lastname || !req.body.email || !req.body.affiliation || !req.body.birthday) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }

    const { username, password, firstname, lastname, email, affiliation, birthday } = req.body;
    console.log(username);
    const imagePath = req.file.path;

    // Check if the username already exists
    const exists = await db.send_sql(`SELECT * FROM users WHERE username = '${username}'`);
    if (exists.length > 0) {
        console.log('User already exists');
        return res.status(409).json({ error: 'An account with this username already exists, please try again.' });
    }
    helper.uploadToS3(username, req.file);

    try {
        await facehelper.initializeFaceModels();

        const collection = await client.getOrCreateCollection({
            name: "face-api",
            embeddingFunction: null,
            metadata: { "hnsw:space": "l2" },
        });

        console.info("Looking for files");
        const promises = [];
        const files = await fs.promises.readdir("/nets2120/project-stream-team/models/images");
        // const csvContent = fs.readFileSync('/nets2120/project-stream-team/names.csv', 'utf8');
        // console.log('csvContent', csvContent);

        // files.forEach(function (file) {
        //     console.info("Adding task for " + file + " to index.");
        //     promises.push(facehelper.indexAllFaces(path.join("/nets2120/project-stream-team/models/images", file), file, collection));
        // });

        // console.info("Done adding promises, waiting for completion.");
        // await Promise.all(promises);
        // console.log("All images indexed.");

        const topMatches = await facehelper.findTopKMatches(collection, req.file.path, 5);
        for (var item of topMatches) {
            for (var i = 0; i < item.ids[0].length; i++) {
                console.log(item.ids[0][i] + " (Euclidean distance = " + Math.sqrt(item.distances[0][i]) + ") in " + item.documents[0][i]);
            }
        }
    
        console.log('example document', item.documents[0]);
        actors = item.documents[0];
        const actornConst = actors.map(file => file.replace('.jpg', ''));
        parse(csvContent, { columns: true, skip_empty_lines: true }, function(err, records) {
            if (err) {
                console.error('Error parsing CSV:', err);
                return res.status(500).json({ error: 'Failed to parse CSV data' });
            }

            const nameLookup = {};
            records.forEach(record => {
                nameLookup[record.nconst_short] = record.primaryName;
            });

            const actorNames = actornConst.map(nconst => nameLookup[nconst] || "Actor name not found");
            const actorNamesString = actorNames.join(', '); 
            console.log('actorName:', actorNames);

            // Hash password and insert new user
            helper.encryptPassword(password).then(hashedPassword => {
                db.send_sql(`INSERT INTO users (username, firstname, lastname, email, affiliation, password, birthday, imageUrl, actorsList) VALUES ('${username}', '${firstname}', '${lastname}', '${email}', '${affiliation}', '${hashedPassword}', '${birthday}', '${imagePath}', '${actorNamesString}')`)
                    .then(() => {
                        res.status(200).json({ username, actorNames });
                    })
                    .catch(dbError => {
                        console.error('Database insert failed:', dbError);
                        res.status(500).json({ error: 'Database insertion failed' });
                    });
            });
        });
    } catch (error) {
        console.error('Registration failed:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
};


// POST /users/:username/selections
//updates the user's selected actor and hashtags
var postSelections = async function (req, res) {
    const { username } = req.params;
    const { actor, hashtags } = req.body;


    console.log('postSelection:', actor);
    console.log('postSelection:', hashtags);

    // Validate request parameters
    if (!username || !actor || !hashtags) {
        return res.status(400).json({ error: 'Missing required parameters.' });
    }

    try {
        // Fetch user ID based on username
        const userResult = await db.send_sql(`SELECT user_id FROM users WHERE username = '${username}'`);
        if (userResult.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const userId = userResult[0].user_id;

        const hashtagIds = await Promise.all(hashtags.map(async (hashtagName) => {
            const result = await db.send_sql(`SELECT hashtag_id FROM hashtags WHERE hashtagname = '${hashtagName}'`);
            return result.length > 0 ? result[0].hashtag_id : null;
        }));

        const validHashtagIds = hashtagIds.filter(id => id != null);

        //change linked actor
        await db.send_sql(`UPDATE users SET linkedActor = '${actor}' WHERE username = '${username}'`);

        await Promise.all(validHashtagIds.map(async (hashtagId) => {
            await db.send_sql(`INSERT INTO hashtag_by (user_id, hashtag_id) VALUES ('${userId}', '${hashtagId}')`);
        }));

        res.status(200).json({ message: 'Selections updated successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to update selections' });
    }
};



// POST /login
/** postLogin
 * 
 * @param {*} req 
 * @param {*} res 
 * description: user should be able to log in with their user ID and password
 * @returns returns username upon success -> maybe we should return user object instead?
 */

var postLogin = async function (req, res) {
    // TODO: check username and password and login

    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }

    const username = req.body.username;
    const password = req.body.password;
    console.log('username: ', username);
    console.log('password: ', password);

    try {
        const findUserQuery = `SELECT * FROM users WHERE username = '${username}'`;
        const user = await db.send_sql(findUserQuery);

        if (user.length === 0) {
            console.log('user has zero length');
            return res.status(401).json({ error: 'Username and/or password are invalid.' });
        }

        bcrypt.compare(password, user[0].password, function (err, result) {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).json({ error: 'Error comparing passwords.' });
            }
            if (result) {
                // successful
                console.log('success');
                req.session.user_id = user[0].user_id; // check this
                req.session.username = user[0].username;
                console.log('user id:', req.session.user_id);
                console.log('user name:', req.session.username);
                req.session.save();
                return res.status(200).json({ username: username, session: req.session.user_id});
            } else {
                return res.status(401).json({ error: 'Username and/or password are invalid.' });
            }
        });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};


// GET /logout
var postLogout = function (req, res) {
    req.session.user_id = null;
    res.status(200).json({ message: "You were successfully logged out." });

};

// GET /top10hashtags
var getTopHashtags = async function (req, res) {
    console.log('getTopHashtags called');
    try {
        const query = `
            SELECT h.hashtagname, COUNT(hb.hashtag_id) AS frequency
            FROM hashtags h
            JOIN hashtag_by hb ON h.hashtag_id = hb.hashtag_id
            GROUP BY hb.hashtag_id
            ORDER BY frequency DESC
            LIMIT 10;
        `;
        const results = await db.send_sql(query);
        console.log('getTophashtags result', results);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error querying top hashtags:', error);
        res.status(500).json({ error: 'Error querying database for top hashtags.' });
    }
};

/** createTags
 * 
 * @param {*} req 
 * @param {*} res 
 * description: allow users to create new tags or search if the tag already exists or not
 * @returns returns hashtag upon success
 */
var createTags = async function (req, res) {

    if (!req.body.hashtagname) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }

    const findUserQuery = `SELECT * FROM hashtags WHERE hashtagname = '${hashtagname}'`;
    try {
        const existingTag = await db.send_sql(findUserQuery);

        if (existingTag.length === 0) {
            // hashtag doesn't exist from before so you have to insert
            const createTagQuery = `INSERT INTO hashtags (hashtagname) VALUES ('${hashtagname}')`;
            const res = await db.send_sql(createTagQuery);
            console.log('success: ', res);
        }

        res.status(200).json({ hashtagname: existingTag });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};

/** postTags
 * 
 * @param {*} req 
 * @param {*} res 
 * description: adds the relationship between user and hashtag
 * @returns returns username and hashtag upon success
 */

var postTags = async function (req, res) {
    // SHOULD I CHECK IF USER IS LOGGED IN OR NOT?

    if (!req.body.hashtagname) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }

    const hashtagname = req.body.hashtagname;
    console.log('hashtag: ', hashtagname);

    try {
        const findTagQuery = `SELECT * FROM hashtags WHERE hashtagname = '${hashtagname}'`;
        const existingTag = await db.send_sql(findTagQuery);
        console.log('tag: ', existingTag);
        // CHECK THIS
        const hashtag_id = existingTag.hashtag_id
        console.log('tag id: ', hashtag_id);

        const postTagQuery = `INSERT INTO hashtag_by (hashtag_id, user_id) VALUES ('${hashtag_id}','${req.session.user_id}')`;
        try {
            const existingTag = await db.send_sql(postTagQuery);
            return res.status(200).json({ hashtagid: hashtag_id, user_id: req.session.user_id });
        } catch (error) {
            console.error('Error querying database:', error);
            return res.status(500).json({ error: 'Error querying database.' });
        }
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};

/** getTags
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns returns the top ten most popular hashtags
 */
var getTags = async function (req, res) {

    try {
        // check this query

        const findTagQuery = `
        WITH occurrence AS (
            SELECT DISTINCT hashtag_id,
            COUNT(*) AS freq
            FROM hashtag_by
            GROUP BY hashtag_id
        ),
        top_ten AS (
            SELECT hashtag_id FROM occurrence
            SORT BY freq
            LIMIT 10 DESC
        )
        SELECT DISTINCT hashtagname
        FROM hashtags
        INNER JOIN top_ten ON top_ten.hashtag_id = hashtags.hashtag_id'`;

        const topTenTags = await db.send_sql(findTagQuery);
        console.log('tags: ', topTenTags);

        const results = topTenTags.map(item => ({
            hashtag_id: item.hashtag_id,
            hashtagname: item.hashtagname
        }));

        res.status(200).json({ results });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};


// GET /friends
var getFriends = async function (req, res) {

    console.log('getting friends');

    if (!req.params.username) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    const username = req.params.username;

    // TODO: get all friends of current user
    if (!helper.isLoggedIn(req.session.user_id) || !helper.isOK(username)) {
        // if (!req.session.user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    try {
        const friends = await db.send_sql(`SELECT DISTINCT friends.followed, nFriend.primaryName
        FROM names nUser
        JOIN users user1 ON user1.linked_nconst = nUser.nconst
        JOIN friends ON nUser.nconst = friends.follower
        JOIN names nFriend ON friends.followed = nFriend.nconst
        WHERE user1.user_id = '${req.session.user_id}'`);

        const results = friends.map(friend => ({
            followed: friend.followed,
            primaryName: friend.primaryName
        }));
        res.status(200).json({ results });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }

}

// GET /recommendations
var getFriendRecs = async function (req, res) {

    // TODO: get all friend recommendations of current user

    const { username } = req.params;


    if (!helper.isLoggedIn(req, req.session.user_id) || !helper.isOK(username)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }
    // if (!helper.isLoggedIn(req.session.user_id) || !helper.isOK(username)) {
    // // if (!req.session.user_id) {
    //     return res.status(403).json({ error: 'Not logged in.' });
    // }

    try {
        const recommendations = await db.send_sql(`
        SELECT DISTINCT recommendations.recommendation, nRec.primaryName
        FROM names n JOIN users ON users.linked_nconst = n.nconst
        JOIN recommendations ON n.nconst = recommendations.person
        JOIN names nRec ON recommendations.recommendation = nRec.nconst
        WHERE users.user_id = '${req.session.user_id}'
        `);

        const results = recommendations.map(item => ({
            recommendation: item.recommendation,
            primaryName: item.primaryName
        }));

        res.status(200).json({ results });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }

}


// POST /createPost
var createPost = async function (req, res) {

    // TODO: add to posts table
    if (!req.session.user_id || !helper.isLoggedIn(req.session.user_id)) {
        // if (!req.session.user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    if (!req.body.title || !req.body.content) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }

    const title = req.body.title;
    const content = req.body.content;
    let hashtags = req.body.hashtags;

    if (hashtags) {
        // Remove spaces and split by commas
        hashtags = hashtags.replace(/\s/g, '').split(',');
        // Ensure each hashtag starts with '#'
        hashtags = hashtags.map(tag => {
            // Trim any leading or trailing whitespace
            tag = tag.trim();
            // Add '#' if missing
            if (!tag.startsWith('#')) {
                tag = '#' + tag;
            }
            return tag;
        });
    } else {
        // If no hashtags provided, initialize as an empty array
        hashtags = [];
    }

    // screen the title and content to be alphanumeric
    if (!helper.isOK(title) || !helper.isOK(content)) {
        return res.status(400).json({ error: 'Title and content should only contain alphanumeric characters, spaces, periods, question marks, commas, and underscores.' });
    }

    try {
        // Insert the post into the database
        const postQuery = `INSERT INTO posts (author_id, title, content) VALUES ('${req.session.user_id}', '${title}', '${content}')`;
        const result = await db.send_sql(postQuery);
        const newPostId = result[1][0].new_post_id;
        // 'INSERT INTO posts (parent_post, title, content, author_id) VALUES (?, ?, ?, ?)';
        // await db.send_sql(postQuery, [parent_id, title, content, author_id]);
        // Send the response indicating successful post creation

        // Constructing the SQL query dynamically
        let tagsQuery = `INSERT INTO hashtags (hashtagname) VALUES `;
        hashtags.forEach((tag, index) => {
            tagsQuery += `('${tag}')`;
            if (index !== hashtags.length - 1) {
                tagsQuery += ', ';
            }
        });
        const resultTags = await db.send_sql(tagsQuery);
        // Get the number of rows affected by the insertion
        const numRowsInserted = resultTags.affectedRows;

        // Get the ID of the first newly inserted tag
        const firstTagId = resultTags.insertId;

        // Calculate the IDs of all newly inserted tags
        const newTagIds = Array.from({ length: numRowsInserted }, (_, index) => firstTagId + index);

        let postTagsQuery = `INSERT INTO post_tagged_with (post_id, hashtag_id) VALUES `;
        newTagIds.forEach((tagId, index) => {
            postTagsQuery += `('${newPostId}', '${tagId}')`;
            if (index !== newTagIds.length - 1) {
                postTagsQuery += ', ';
            }
        });

        // Execute the query to insert into post_tagged_with table
        await db.send_sql(postTagsQuery);

        res.status(200).send({ message: "Post created." });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }

}

// GET /feed
//Yes, authors that the current user follows, as well as
//any posts that the current user made. (just like how you can see your own posts in your Instagram feed)
var getFeed = async function (req, res) {
    console.log('getFeed is called', req.session.user_id);

    // TODO: get the correct posts to show on current user's feed
    if (!helper.isLoggedIn(req)) {
        return res.status(403).json({ error: 'Not logged in.' });
    } else if (helper.isLoggedIn(req)) {
        console.log('success');
    }
    const userId = req.session.user_id;

    console.log('curr id: ', req.session.user_id);
    // GRACE TODO: Check the tables
    // TODO: sql query is WRONG
    // TODO: also retrieve hashtags
    try {
        console.log('trying');
        const feed = await db.send_sql(`
            SELECT 
                posts.post_id AS post_id, 
                posts.timestamp AS post_timestamp,
                post_users.username AS post_author, 
                posts.parent_post AS parent_post, 
                posts.title AS title, 
                posts.content AS content, 
                CONCAT_WS(' | ', hashtags.hashtagname) AS hashtags, 
                CONCAT_WS(' | ', GROUP_CONCAT(CONCAT(comments.content, ',', comments.timestamp, ',', comments_users.username) ORDER BY comments.timestamp ASC SEPARATOR ' | ')) AS comments
            FROM 
                posts
            JOIN 
                users AS post_users ON posts.author_id = post_users.user_id
            JOIN 
                post_tagged_with ON post_tagged_with.post_id = posts.post_id
            JOIN 
                hashtags ON hashtags.hashtag_id = post_tagged_with.hashtag_id
            LEFT JOIN 
                (
                    SELECT 
                        comments_on_post_by.post_id,
                        comments.content,
                        comments.timestamp,
                        comments_users.username
                    FROM 
                        comments_on_post_by
                    LEFT JOIN 
                        comments ON comments_on_post_by.comment_id = comments.comment_id
                    LEFT JOIN 
                        users AS comments_users ON comments.author_id = comments_users.user_id
                    ORDER BY 
                        comments.timestamp ASC
                ) AS comments ON comments.post_id = posts.post_id
            WHERE 
                posts.author_id = '${userId}' 
                OR posts.author_id IN (
                    SELECT 
                        followed 
                    FROM 
                        friends 
                    WHERE 
                        follower = '${userId}'
                )
            GROUP BY
                posts.post_id
            ORDER BY 
                posts.post_id DESC;

        `);

        // Send the response with the list of posts for the feed
        const results = feed.map(post => ({
            username: post.post_author,
            parent_post: post.parent_post,
            post_author: post.post_author,
            post_timestamp: post.post_timestamp,
            title: post.title,
            content: post.content,
            hashtags: post.hashtags.split(' | '),
            comments: post.comments.split(' | ').map(commentString => {
                const [content, timestamp, author] = commentString.split(',');
                return {
                    content: content.trim(),
                    timestamp: timestamp.trim(),
                    author: author.trim()
                };
            }),
        }));
        res.status(200).json({ results });

    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

var getMovie = async function (req, res) {
    const vs = await getVectorStore();
    const retriever = vs.asRetriever();

    const prompt =
        PromptTemplate.fromTemplate({
            context: 'Based on the context: {context}, answer the question: {question}',
            contextParams: { context: req.body.context, question: req.body.question }
        });
    //const llm = null; // TODO: replace with your language model
    const llm = new ChatOpenAI({ apiKey: process.env.OPENAI_API_KEY, modelName: 'gpt-3.5-turbo', temperature: 0 });

    const ragChain = RunnableSequence.from([
        {
            context: retriever.pipe(formatDocumentsAsString),
            question: new RunnablePassthrough(),
        },
        prompt,
        llm,
        new StringOutputParser(),
    ]);

    console.log(req.body.question);

    result = await ragChain.invoke(req.body.question);
    console.log(result);
    res.status(200).json({ message: result });
}

// GET /chat
/** getChat 
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns -> retrieves all the current chats that users have
 */
var getChatAll = async function (req, res) {
    console.log('getChatAll is called');

    // TODO: get the correct posts to show on current user's feed
    // if (!helper.isLoggedIn(req.session.user_id)) {
    //     return res.status(403).json({ error: 'Not logged in.' });
    // }
    // const userId = req.session.user_id;
    // const username = req.body.username;

    // console.log('curr id: ', req.session.user_id);
    // user_id = req.session.user_id;
    // console.log('req ', req);
    user_id = req.query.user_id;
    console.log('curr id: ', user_id);
    // GRACE TODO: Check the tables
    try {
        // maybe I should add a last text entry to chat so we can keep track?
        // last text id so that it is easier to display too
        console.log('trying');

        const getChatQuery = `
        WITH chat_agg AS (
            SELECT t1.chat_id, t1.user_id
            FROM user_chats t1
            JOIN (SELECT * FROM user_chats WHERE user_id = ${user_id}) t2
            ON t1.chat_id = t2.chat_id
        ), with_name AS (
            SELECT t1.chat_id, t2.username
            FROM chat_agg t1
            JOIN users t2 ON t1.user_id = t2.user_id
        )
        SELECT chat_id, GROUP_CONCAT(username SEPARATOR ', ') AS users
        FROM with_name
        GROUP BY chat_id;        
        `;

        // const getChatQuery = `
        // SELECT c1.chat_id, c1.chatname
        // FROM chats c1
        // JOIN (SELECT * FROM user_chats WHERE user_id = ${user_id}) c2
        // ON c1.chat_id = c2.chat_id
        // `;
        
        const allChats = await db.send_sql(getChatQuery);
        console.log('all chats backend', allChats);

        // Send the response with the list of posts for the feed
        const results = allChats.map(chat => ({
            chat_id: chat.chat_id,
            chatname: chat.users,
        }));
        console.log('results backend', results);
        res.status(200).json({ results });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }

}

// GET /chat/{chatId}
/** getChat 
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns -> retrieves all the current chats that users have
 */
// check how the id should be 
var getChatById = async function (req, res) {
    console.log('getChat is called');

    // TODO: get the correct posts to show on current user's feed
    if (!helper.isLoggedIn(req.session.user_id)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }
    if (req.body.chatId) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }

    const userId = req.session.user_id;
    // const username = req.body.username;
    const chatId = req.body.chatId;

    // first check if the user is a part of that chat?
    const checkUserQuery = `
    SELECT *
    FROM user_chats
    WHERE user_id = ${userId} AND chat_id = ${chatId}`;
    // let userChats = [];

    try {
        const userChats = await db.send_sql(checkUserQuery);
        if (userChats.length <= 0) {
            // check error - maybe do an alert as well?
            return res.status(409).json({ error: 'USER IS NOT IN THIS CHAT' });
        }
        console.log('user and chat are valid next');
    } catch (err) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }

    const getChatInfo = `
    SELECT *
    FROM texts
    WHERE chat_id = ${chatId}`;

    try {
        const chatInfo = await db.send_sql(checkUserQuery);

        const results = chatInfo.map(chat => ({
            text_id: chat.text_id,
            sender: chat.author_id,
            chat_id: chat.chat_id,
            content: chat.content,
            timestamp: chat.timestamp
        }));
        res.status(200).json({ results });

    } catch (err) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }

}



// POST /postChat
var postChat = async function(req, res) {
    console.log('creating chat')
    // if (!req.session.user_id || !helper.isLoggedIn(req.session.user_id)) {
    //     return res.status(403).json({ error: 'Not logged in.' });
    // }

    // if (!req.body.title || !req.body.content) {
    //     return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    // }
    // const chatAdmin = req.session.user_id;
    // const chatName = req.body.chatName;

    // rn its by query..check if that;s ok?

    if (!req.body.chatName) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }
    // const chatAdmin = req.session.user_id;
    const chatAdmin = req.body.user_id;
    const chatName = req.body.chatName;

    // screen the title and content to be alphanumeric
    if (!helper.isOK(chatName)) {
        return res.status(400).json({ error: 'Chatname should only contain alphanumeric characters, spaces, periods, question marks, commas, and underscores.' });
    }

    try {
        // Insert the post into the database
        //  CHECK IF I CAN INSERT A NULL
        // might not need chatname anymore
        const postQuery = `INSERT INTO chats (chatname, admin_id) VALUES ('${chatName}', '${chatAdmin}')`;
        await db.send_sql(postQuery);

        // retrieve the chat id by finding the number of rows and getting the last one..
        const countChatsQuery = `SELECT COUNT(*) AS totalChats FROM chats`;
        const countResult = await db.send_sql(countChatsQuery);
        const chatId = countResult[0].totalChats;

        // add chat and user relation
        const postUserChat = `INSERT INTO user_chats (user_id, chat_id) VALUES ('${chatAdmin}', '${chatId}')`;
        await db.send_sql(postUserChat);
        res.status(201).send({
            message: "Chat created.",
            chat_id: chatId
        });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

// consider having an invite button for people to add friends into it
// let's do one invite per route


// GET /chat
/** getChat 
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns -> retrieves all the current chats that users have
 */
var getInviteAll = async function (req, res) {
    console.log('getInviteAll is called');

    // TODO: get the correct posts to show on current user's feed
    // if (!helper.isLoggedIn(req.session.user_id)) {
    //     return res.status(403).json({ error: 'Not logged in.' });
    // }
    // const userId = req.session.user_id;
    // const username = req.body.username;

    // console.log('curr id: ', req.session.user_id);
    // user_id = req.session.user_id;
    // console.log('req ', req);
    user_id = req.query.user_id;
    console.log('curr id: ', user_id);
    // GRACE TODO: Check the tables
    try {
        console.log('invite trying');
        // maybe I should add a last text entry to chat so we can keep track?
        // last text id so that it is easier to display too
        // consider changing this to just include the username now
        // 
        const getInviteQuery = `
        WITH invite_agg AS (
            SELECT i1.invite_id, i1.chat_id, i1.invitee_id, i1.inviter_id, i1.confirmed
            FROM invites i1
            JOIN (SELECT * FROM user_invites WHERE user_id = ${user_id}) i2
            ON i1.invite_id = i2.invite_id
        )
        SELECT t1.invite_id, t1.inviter_id, t2.username, t3.chatname, t1.confirmed
        FROM invite_agg t1
        JOIN users t2 ON t1.inviter_id = t2.user_id
        JOIN chats t3 ON t1.chat_id = t3.chat_id
        `;
        const allInvites = await db.send_sql(getInviteQuery);
        console.log('all invites backend', allInvites);

        const results = allInvites.map(invite => ({
            inviterName: invite.username,
            inviteId: invite.invite_id,
            inviterId: invite.inviter_id,
            chatroomName: invite.chatname,
            confirmed: invite.confirmed
        }));
        console.log('results backend', results);
        res.status(200).json({ results });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }

}

// POST /postInvite
var postInvite = async function(req, res) {
    // TODO: add to posts table
    console.log('posting invite');
    if (!req.session.user_id || !helper.isLoggedIn(req.session.user_id)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    const inviterId = req.session.user_id;

    if (!req.body.inviteeId || !req.body.chatId) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }
    const inviteeId = req.body.inviteeId; // would it be id or name..?
    const chatId = req.session.chatId;

    // have to check for the case when 3 ppl amek the same groupchat
    
    // first check if the two users are already in an existing groupchat
    try {
        const checkChat = `WITH agg AS (
            SELECT DISTINCT chat_id,
            GROUP_CONCAT(user_id ORDER BY user_id) AS user_ids
            FROM user_chats
            GROUP BY chat_id
        )
        SELECT chat_id
        FROM agg
        WHERE FIND_IN_SET(${inviterId}, user_ids) > 0
          AND FIND_IN_SET(${inviteeId}, user_ids) > 0`;
        const check = await db.send_sql(checkChat);
        if (check.length > 0) {
            return res.status(409).json({ error: 'Chat session already exists' });
        }
    } catch (err) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }

    try {
        // Insert the post into the database
        //  DELETE CHAT-ID FROM IT
        // const postInvite = `INSERT INTO invites (chat_id, invitee_id, inviter_id, confirmed) VALUES ('${chatId}', '${inviteeId}', '${inviterId}', 0)`; // FALSE is 0
        const postInvite = `INSERT INTO invites (invitee_id, inviter_id, confirmed) VALUES ('${inviteeId}', '${inviterId}', 0)`; // FALSE is 0

        await db.send_sql(postInvite);

        const countInvQuery = `SELECT COUNT(*) AS totalInvites FROM invites`;
        const countResult = await db.send_sql(countInvQuery);
        const inviteId = countResult[0].totalInvites;

        const postUInvite = `INSERT INTO user_invites (user_id, invite_id) VALUES ('${inviteeId}', '${inviteId}')`; // FALSE is 0
        await db.send_sql(postUInvite);
        res.status(201).send({ message: "Invite sent." });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}


// POST /postInviteChat
// sends invite for an existing group -> checking condition is slightly different
// first, cheeck if the user_chats aready has that id with the user
var postInviteChat = async function(req, res) {
    // TODO: add to posts table
    console.log('posting invite into existing chat');
    // if (!req.session.user_id || !helper.isLoggedIn(req.session.user_id)) {
    //     return res.status(403).json({ error: 'Not logged in.' });
    // }

    // const inviterId = req.session.user_id;
    const inviterId = req.query.user_id;

    if (!req.query.inviteeId || !req.query.chatId) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }
    const inviteeId = req.body.inviteeId; // would it be id or name..?
    const chatId = req.session.chatId;

    try {
        const checkInvite = `SELECT * FROM user_chats WHERE user_id = ${inviteeId} and chat_id = ${chatId}`;
        const check = await db.send_sql(checkInvite);
        if (check.length > 0) {
            return res.status(409).json({ error: 'User is already in chat! Please add another user!' });
        } else {
            try {
                const postInvite = `INSERT INTO invites (invitee_id, chat_id, inviter_id, confirmed) VALUES ('${inviteeId}', '${chatId}', '${inviterId}', 0)`;

                await db.send_sql(postInvite);

                const getInviteId = `SELECT LAST_INSERT_ID() AS invite_id`;
                const r1 = await db.send_sql(getInviteId);
                const inviteId = r1[0].invite_id;
                try {
                    //  check if I need quotations for this or not
                    const postUInvite = `INSERT INTO user_invites (user_id, invite_id) VALUES (${inviteeId}, ${inviteId})`;
                    const r2 = await db.send_sql(postUInvite);

                } catch(err) {
                    console.error('Error querying database:', error);
                    return res.status(500).json({ error: 'Error querying database.' });
                }
                // const check = await db.send_sql(checkChat);
            } catch (err) {
                console.error('Error querying database:', error);
                return res.status(500).json({ error: 'Error querying database.' });
            }
        }
    } catch (err) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }

    try {
        // Insert the post into the database
        //  DELETE CHAT-ID FROM IT
        // const postInvite = `INSERT INTO invites (chat_id, invitee_id, inviter_id, confirmed) VALUES ('${chatId}', '${inviteeId}', '${inviterId}', 0)`; // FALSE is 0
        // check if for the chat_id i can probably just 
        const postInvite = `INSERT INTO invites (invitee_id, inviter_id, confirmed) VALUES ('${inviteeId}', '${inviterId}', 0)`; // FALSE is 0

        await db.send_sql(postInvite);

        const countInvQuery = `SELECT COUNT(*) AS totalInvites FROM invites`;
        const countResult = await db.send_sql(countInvQuery);
        const inviteId = countResult[0].totalInvites;

        const postUInvite = `INSERT INTO user_invites (user_id, invite_id) VALUES ('${inviteeId}', '${inviteId}')`; // FALSE is 0
        await db.send_sql(postUInvite);
        res.status(201).send({ message: "Invite sent." });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}


// UPDATE /confirmInvite
var confirmInvite = async function(req, res) {
    // Check if the user is logged in
    console.log('confirming invite');
    // if (!req.session.user_id || !helper.isLoggedIn(req.session.user_id)) {
    //     return res.status(403).json({ error: 'Not logged in.' });
    // }

    // check about chatId
    if (!req.query.inviteId || !req.query.chatId) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }

    const inviteId = req.query.inviteId;
    const adminId = req.query.adminId;
    // const user_id =req.session.user_id;
    const user_id = req.query.user_id;
    // either it's included or I might have to include it
    // maybe when you display it it's already in there
    // const chatId = req.query.chatId;

    try {
        // Update the confirmation status in the database
        const updateQuery = `UPDATE invites SET confirmed = 1 WHERE invite_id = ${inviteId}`;
        await db.send_sql(updateQuery);

        const postChat = `INSERT INTO chats (chatname, admin_id) VALUES ('${adminId}', '${adminId}')`;
        await db.send_sql(postChat);

        const getChatIdQuery = `SELECT LAST_INSERT_ID() AS chat_id`;
        const r1 = await db.send_sql(getChatIdQuery);
        const chatId = r1[0].chat_id;

        // create new row in user chats
        const postUserChat = `INSERT INTO user_chats (user_id, chat_id) VALUES ('${user_id}', '${chatId}')`;
        await db.send_sql(postUserChat);

        res.status(200).json({ message: "Invite confirmation updated successfully and posted." });
    } catch (error) {
        console.error('Error updating invite confirmation:', error);
        return res.status(500).json({ error: 'Error updating invite confirmation.' });
    }
}


// DELETE /leaveChatroom
var leaveChatroom = async function(req, res) {
    // Check if the user is logged in
    if (!req.session.user_id || !helper.isLoggedIn(req.session.user_id)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    if (!req.body.chatId) {
        return res.status(400).json({ error: 'chat ID is missing.' });
    }

    const user_id = req.session.user_id;
    const chatId = req.body.chatId;

    try {
        const deleteQuery = `DELETE FROM user_chats WHERE user_id = ${user_id} AND chat_id = ${chatId}`;
        // might also have to delete from user_invites unless foreign key already does tht>
        await db.send_sql(deleteQuery);

        res.status(200).json({ message: "Left chatroom successfully." });
    } catch (error) {
        console.error('Error deleting invite:', error);
        return res.status(500).json({ error: 'Error leaving chatroom.' });
    }
}


// DELETE /deleteInvite
var deleteInvite = async function(req, res) {
    // Check if the user is logged in
    console.log('delete invite is called');
    // if (!req.session.user_id || !helper.isLoggedIn(req.session.user_id)) {
    //     return res.status(403).json({ error: 'Not logged in.' });
    // }

    if (!req.query.inviteId) {
        return res.status(400).json({ error: 'Invite ID is missing.' });
    }

    const inviteId = req.query.inviteId;
    // const user_id = req.session.user_id;
    const user_id = req.query.user_id;

    try {
        const deleteQuery = `DELETE FROM invites WHERE invite_id = ${inviteId}`;
        // might also have to delete from user_invites unless foreign key already does tht>
        await db.send_sql(deleteQuery);

        const deleteUInvite = `DELETE FROM user_invites WHERE invite_id = ${inviteId} AND user_id = ${user_id}`;
        await db.send_sql(deleteUInvite);
        res.status(200).json({ message: "Invite deleted successfully." });
    } catch (error) {
        console.error('Error deleting invite:', error);
        return res.status(500).json({ error: 'Error deleting invite.' });
    }
}

// GET /chat/{chatId}
/** getChat 
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns -> retrieves all the current chats that users have
 */
// check how the id should be 
// THIS IS FOR FINDING FRIENDS WITH THE FOLLOWING USERNAME
var getFriendName = async function(req, res) {

    console.log('getting friend by name');
    
    // if (!helper.isLoggedIn(req.session.user_id)) {
    //     return res.status(403).json({ error: 'Not logged in.' });
    // }

    // const user_id = req.session.user_id;
    const user_id = req.query.user_id;
    console.log('user id ', user_id);

    if (!req.query.username) {
        return res.status(400).json({ error: 'Friend username is missing.' });
    }

    const friendName = req.query.username;
    console.log('friendName ', friendName);
    // const friendName = req.body.username;

    // return a list of people with similar names

    const findUserQuery = `
    SELECT *
    FROM users
    WHERE username LIKE '%${friendName}%`;

    const findFriendnameQuery = `WITH filtered_friends AS (
        SELECT followed, follower FROM friends WHERE follower = ${user_id}
    ) 
    , filtered_users AS (
        SELECT * FROM filtered_friends t1
        JOIN users t2
        WHERE t1.followed = t2.user_id
    )
    SELECT user_id, username FROM filtered_users WHERE username LIKE '%${friendName}%'`;

    try {
        const searchRes = await db.send_sql(findFriendnameQuery);
        if (searchRes.length <= 0) {
            // check error - maybe do an alert as well?
            return res.status(200).json({}); // no user exist
            // return res.status(409).json({ error: 'NO USER WITH THIS USERNAME FOUND'});
        }
        console.log('searchRes', searchRes);
        // Send the response with the list of posts for the feed
        const results = searchRes.map(res => ({
            user_id: res.user_id,
            username: res.username,
            // firstname: res.firstname,
            // lastname: res.lastname,
            // affiliation: res.lastname, 
            // password: res.lastname,
            // birthday: res.birthday,
            // profile_photo: res.profile_photo
        }));
        res.status(200).json({results});
    } catch (err) {
        console.error('Error querying database:', err);
        return res.status(500).json({ err: 'Error querying database.' });
    }
}

// POST /friends
// when user A CLICKS FOLLOW/ADD friend B, we insert (followed = B, follower = A) into friends table
var addFriends = async function (req, res) {

    if (!helper.isLoggedIn(req.session.user_id)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    if (!req.params.friend_id) {
        return res.status(400).json({ error: 'Invite ID is missing.' });
    }

    const userId = req.session.user_id;
    const friendId = req.body.friend_id;

    try {
        const friends = await db.send_sql(`INSERT INTO friends (followed, follower) VALUES ('${friendId}', '${userId}')`);
        res.status(201).json({ message: "Added as friends successfully" }); // maybe print out the id's to check
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }

}


// POST /postText
var postText = async function(req, res) {

    console.log('sending text');

    // if (!req.session.user_id || !helper.isLoggedIn(req.session.user_id)) {
    //     return res.status(403).json({ error: 'Not logged in.' });
    // }

    // const message = req.body.message;
    // const senderId = req.session.user_id; // Assuming the user ID is stored in the session
    // const inviteeId = req.body.inviteeId; // Assuming the invitee ID is provided in the request body
    // const chatId = req.body.chatId; // Assuming the chat ID is provided in the request body

    const author_id = req.sessions.user_id;
    const chat_id = req.body.chat_id; // Assuming the user ID is stored in the session
    const timestamp = req.body.timestamp; // Assuming the invitee ID is provided in the request body
    const content = req.body.content;

    try {
        // Insert the message into the database
        const insertQuery = `INSERT INTO texts (author_id, chat_id, content, timestamp) VALUES (?, ?, ?, ?)`;
        // const insertQuery = `INSERT INTO messages (sender_id, message_content, chat_id) VALUES (?, ?, ?)`;
        await db.send_sql(insertQuery, [author_id, chat_id, content, timestamp]);

        // // Insert the message into the invites table - PROBA won't need this?
        // const inviteQuery = `INSERT INTO invites (chat_id, invitee_id, inviter_id, confirmed) VALUES (?, ?, ?, 0)`;
        // await db.send_sql(inviteQuery, [chatId, inviteeId, senderId]);

        // Send a success response
        res.status(201).json({ message: "Message sent successfully." });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

// GET // /getTextByChatId
var getTextByChatId = async function(req, res) {

    // if (!req.session.user_id || !helper.isLoggedIn(req.session.user_id)) {
    //     return res.status(403).json({ error: 'Not logged in.' });
    // }

    // const message = req.body.message;
    // const senderId = req.session.user_id; // Assuming the user ID is stored in the session
    // const inviteeId = req.body.inviteeId; // Assuming the invitee ID is provided in the request body
    // const chatId = req.body.chatId; // Assuming the chat ID is provided in the request body

    // const author_id = req.sessions.user_id;
    console.log('getting texts from chat_id');
    // if (!req.body.chat_id) {
    //     console.log('null chat_id');
    // }
    const chat_id = req.query.chat_id; // Assuming the user ID is stored in the session
    // const timestamp = req.body.timestamp; // Assuming the invitee ID is provided in the request body
    // const content = req.body.content;
    

    try {
        const getQuery = `SELECT t1.text_id,
        t1.author_id,
        t1.chat_id,
        t1.content,
        t1.timestamp,
        t2.username 
        FROM texts t1
        JOIN users t2
        ON t1.author_id = t2.user_id
        WHERE t1.chat_id = ${chat_id}`;

        const texts = await db.send_sql(getQuery);
        console.log('texts of chat id', texts);
        const results = texts.map(text => ({
            sender_id: text.author_id,
            sender: text.username,
            message: text.content,
            timestamp: text.timestamp
        }));
        console.log('text results backend', results);
        res.status(200).json({ results });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}


/* Here we construct an object that contains a field for each route
   we've defined, so we can call the routes from app.js. */

var routes = {
    get_helloworld: getHelloWorld,
    post_login: postLogin,
    post_register: postRegister,
    post_logout: postLogout,
    get_friends: getFriends,
    get_friend_recs: getFriendRecs,
    get_movie: getMovie,
    create_post: createPost,
    get_feed: getFeed,
    post_selections: postSelections, 
    get_top_hashtags: getTopHashtags,
        get_chat_by_id: getChatById,
    get_chat_all: getChatAll,
    post_chat: postChat,
    post_text: postText,
    post_invite_chat: postInviteChat,
    get_invite_all: getInviteAll,
    post_invite: postInvite,
    confirm_invite: confirmInvite,
    add_friends: addFriends,
    get_friend_by_username: getFriendName,
    delete_invite: deleteInvite,
    leave_chatroom: leaveChatroom,
    get_text_by_chat_id: getTextByChatId
  };


module.exports = routes;
