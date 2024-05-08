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
const AWS = require('aws-sdk');
const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const bcrypt = require('bcrypt');
const helper = require('../routes/route_helper.js');
var path = require('path');
const { ChromaClient } = require("chromadb");
const fs = require('fs');
const tf = require('@tensorflow/tfjs-node');
const faceapi = require('@vladmandic/face-api');
const facehelper = require('../models/faceapp.js');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); 

const mysql = require('mysql2');
const client = new ChromaClient();
const parse = require('csv-parse').parse;
const csvContent = fs.readFileSync('/nets2120/project-stream-team/names.csv', 'utf8');

let session_user_id; // global

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

/* S3 Functions */
const multer = require("multer");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const AWS = require("aws-sdk");
const fs = require("fs");

const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AUTH_TOKEN,
  }
});

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AUTH_TOKEN,
  region: "us-east-1",
});

const uploadPostsToS3 = async (file, postId, bucketName) => {
  console.log("Uploading post image to S3");

  const fileContent = fs.readFileSync(file.path);
  const keyName = `posts/${postId}-${Date.now()}${path.extname(
    file.originalname
  )}`;

  const params = {
    Bucket: bucketName,
    Key: keyName,
    Body: fileContent,
    ACL: "public-read",
  };

  try {
    const data = await s3.upload(params).promise();
    console.log(`Post image uploaded successfully. ${data.Location}`);
    return data.Location;
  } catch (err) {
    console.error("Error uploading post image:", err);
    throw err;
  }
};

// const getS3Object = async (bucketName, fileKey) => {
//   try {
//     const data = await s3Client.send(
//       new GetObjectCommand({
//         Bucket: bucketName,
//         Key: fileKey,
//       })
//     );
//     const bodyContents = await streamToString(data.Body);
//     console.log(bodyContents);
//     return bodyContents;
//   } catch (err) {
//     console.error("Error", err);
//     throw err;
//   }
// };


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
    
            const csvContent = fs.readFileSync('/nets2120/project-stream-team/names.csv', 'utf8');
    //         console.log('csvContent', csvContent);
    
    //         files.forEach(function (file) {
    //             console.info("Adding task for " + file + " to index.");
    //             promises.push(facehelper.indexAllFaces(path.join("/nets2120/project-stream-team/models/images", file), file, collection));
    //         });
    
            console.info("Done adding promises, waiting for completion.");
            await Promise.all(promises);
            console.log("All images indexed.");
    
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
                session_user_id = req.session.user_id;
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
    session_user_id = null;
    res.status(200).json({ message: "You were successfully logged out." });

};

// GET /top10hashtags
var getTopHashtags = async function (req, res) {
    console.log('getTopHashtags called');
    try {
        const query = `
            SELECT h.hashtagname, COUNT(ptw.hashtag_id) AS frequency
            FROM hashtags h
            JOIN post_tagged_with ptw ON h.hashtag_id = ptw.hashtag_id
            GROUP BY h.hashtag_id, h.hashtagname
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
    // if (!req.session.user_id || !helper.isLoggedIn(req.session.user_id)) {
    //   return res.status(403).json({ error: 'Not logged in.' });
    // }
    console.log(req.body);
    const { title, hashtags, content } = req.body;
    // console.log(title);
    // console.log(hashtags);
    console.log(content);
    // let content = req.file;  // Assuming content is a file uploaded and parsed by middleware like `multer`
    let parent_id = req.body.parent_post || null;
  
    if (!title || !content) {
      return res.status(400).json({ error: 'Title or content must be provided.' });
    }
  
    if (!helper.isOK(title) || (content && !helper.isOK(content.originalname))) {  // Validate file name if content is a file
      return res.status(400).json({ error: 'Invalid characters in title or file name.' });
    }
  
    try {
      const postQuery = `INSERT INTO posts (author_id, title, content, parent_post, timestamp) VALUES (?, ?, ?, ?, NOW())`;
      const postResult = await db.send_sql(postQuery, [req.session.user_id, title, content.path, parent_id]); // Assuming `content.path` is where the file is stored
      const newPostId = postResult.insertId;
  
      if (hashtags) {
        const tags = hashtags.split(',').map(tag => tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`);
        tags.forEach(async (tag) => {
          let tagId = (await db.send_sql(`SELECT hashtag_id FROM hashtags WHERE hashtagname = ?`, [tag]))[0]?.hashtag_id;
          if (!tagId) {
            tagId = (await db.send_sql(`INSERT INTO hashtags (hashtagname) VALUES (?)`, [tag])).insertId;
          }
          await db.send_sql(`INSERT INTO post_tagged_with (post_id, hashtag_id) VALUES (?, ?)`, [newPostId, tagId]);
        });
      }
  
      res.status(200).send({ message: "Post created successfully." });
    } catch (error) {
      console.error('Error querying database:', error);
      return res.status(500).json({ error: 'Error querying database.' });
    }
  };


// GET /posts 
// getting post info (from posts table)
// select everything from the posts 
// GET /feed
var getFeed = async function (req, res) {
    console.log('getFeed is called', req.session.user_id);

    if (!req.session.user_id) {  // Ensuring user is logged in
        return res.status(403).json({ error: 'Not logged in.' });
    }

    const userId = req.session.user_id;
    console.log('curr id: ', userId);
    
    try {
        console.log('trying to fetch feed');
        const feedQuery = `
            SELECT 
                p.post_id AS post_id, 
                p.timestamp AS post_timestamp,
                u.username AS post_author, 
                p.parent_post AS parent_post, 
                p.title AS title, 
                p.content AS content, 
                CONCAT_WS(' | ', h.hashtagname) AS hashtags,
                COUNT(plb.liker_id) AS likes_count,
                CONCAT_WS(' | ', GROUP_CONCAT(CONCAT(c.content, ',', c.timestamp, ',', cu.username) ORDER BY c.timestamp ASC SEPARATOR ' | ')) AS comments
            FROM 
                posts p
            JOIN 
                users u ON p.author_id = u.user_id
            LEFT JOIN 
                post_tagged_with ptw ON ptw.post_id = p.post_id
            LEFT JOIN 
                hashtags h ON h.hashtag_id = ptw.hashtag_id
            LEFT JOIN 
                posts_liked_by plb ON plb.post_id = p.post_id
            LEFT JOIN 
                comments_on_post_by copb ON copb.post_id = p.post_id
            LEFT JOIN 
                comments c ON copb.comment_id = c.comment_id
            LEFT JOIN 
                users cu ON c.author_id = cu.user_id
            GROUP BY
                p.post_id
            ORDER BY 
                p.timestamp DESC;
        `;

        const feed = await db.send_sql(feedQuery);

        const results = feed.map(post => ({
            post_id: post.post_id,
            username: post.post_author,
            parent_post: post.parent_post,
            post_author: post.post_author,
            post_timestamp: post.post_timestamp,
            title: post.title,
            content: post.content,
            likes_count: post.likes_count,
            hashtags: post.hashtags.split(' | '),
            comments: post.comments ? post.comments.split(' | ').map(commentString => {
                const [content, timestamp, author] = commentString.split(',');
                return {
                    content: content.trim(),
                    timestamp: timestamp.trim(),
                    author: author.trim()
                };
            }) : []
        }));

        res.status(200).json({ results });
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Error querying database.' });
    }
};



// posting stuff onto the feed!!!!!!!!!!!!
// PUT /updatePost
// var updatePost = async function (req, res) {
//     console.log('updatePost called', req.session.user_id);

//     if (!req.session.user_id) {
//         return res.status(403).json({ error: 'Not logged in.' });
//     }

//     const userId = req.session.user_id;
//     const postId = req.body.postId;
//     const newContent = req.body.newContent;

//     // Check if the post belongs to the user or the user has the right to edit the post
//     try {
//         const postOwnerCheckQuery = `
//             SELECT author_id FROM posts WHERE post_id = ?;
//         `;
//         const postOwnerCheckResult = await db.send_sql(postOwnerCheckQuery, [postId]);
//         if (postOwnerCheckResult.length > 0 && postOwnerCheckResult[0].author_id === userId) {
//             // User owns the post or has rights to edit it
//             const updatePostQuery = `
//                 UPDATE posts
//                 SET content = ?
//                 WHERE post_id = ?;
//             `;
//             await db.send_sql(updatePostQuery, [newContent, postId]);
//             console.log('Post updated successfully.');
//             res.status(200).json({ message: 'Post updated successfully.' });
//         } else {
//             console.log('Unauthorized attempt to edit post.');
//             res.status(403).json({ error: 'Unauthorized attempt to edit post.' });
//         }
//     } catch (error) {
//         console.error('Error updating post:', error);
//         res.status(500).json({ error: 'Error updating post in database.' });
//     }
// };

//module.exports = updatePost;


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
    console.log('getChat is called');

    // TODO: get the correct posts to show on current user's feed
    if (!helper.isLoggedIn(req.session.user_id)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }
    // const userId = req.session.user_id;
    // const username = req.body.username;

    console.log('curr id: ', req.session.user_id);
    // GRACE TODO: Check the tables
    try {
        // maybe I should add a last text entry to chat so we can keep track?
        // last text id so that it is easier to display too
        const getChatQuery = `
        SELECT c1.chat_id, c1.chatname, c1.latest_text_id
        FROM chats c1
        JOIN (SELECT * FROM user_chats WHERE user_id = ${req.session.user_id}) c2
        ON c1.chat_id = c2.chat_id
        `;
        const allChats = await db.send_sql(getChatQuery);

        // Send the response with the list of posts for the feed
        const results = allChats.map(chat => ({
            chat_id: chat.chat_id,
            chatname: chat.chatname,
            latest_text_id: chat.latest_text_id,
        }));
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
    // TODO: add to posts table
    if (!req.session.user_id || !helper.isLoggedIn(req.session.user_id)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    if (!req.body.title || !req.body.content) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }
    const chatAdmin = req.session.user_id;
    const chatName = req.body.chatName;

    // screen the title and content to be alphanumeric
    if (!helper.isOK(chatName)) {
        return res.status(400).json({ error: 'Chatname should only contain alphanumeric characters, spaces, periods, question marks, commas, and underscores.' });
    }

    try {
        // Insert the post into the database
        //  CHECK IF I CAN INSERT A NULL
        const postQuery = `INSERT INTO posts (chatname, latest_text_id, admin_id) VALUES ('${chatName}', NULL, '${chatAdmin}')`;
        await db.send_sql(postQuery);

        // retrieve the chat id by finding the number of rows and getting the last one..
        const countChatsQuery = `SELECT COUNT(*) AS totalChats FROM chats`;
        const countResult = await db.send_sql(countChatsQuery);
        const chatId = countResult[0].totalChats;

        // add chat and user relation
        const postUserChat = `INSERT INTO user_chats (user_id, chat_id) VALUES ('${chatAdmin}', NULL, '${chatId}')`;
        await db.send_sql(postUserChat);
        res.status(201).send({ message: "Chat created." });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

// consider having an invite button for people to add friends into it
// let's do one invite per route

// POST /postChat
var postInvite = async function(req, res) {
    // TODO: add to posts table
    if (!req.session.user_id || !helper.isLoggedIn(req.session.user_id)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    const inviterId = req.session.user_id;

    if (!req.body.inviteeId || !req.body.chatId) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }
    const inviteeId = req.body.inviteeId; // would it be id or name..?
    const chatId = req.session.chatId;

    try {
        // Insert the post into the database
        //  CHECK IF I CAN INSERT A NULL
        const postInvite = `INSERT INTO invites (chat_id, invitee_id, inviter_id, confirmed) VALUES ('${chatId}', '${inviteeId}', '${inviterId}', 0)`; // FALSE is 0
        await db.send_sql(postInvite);
        res.status(201).send({ message: "Invite sent." });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

// POST /postChat
var postInvite = async function(req, res) {
    // TODO: add to posts table
    if (!req.session.user_id || !helper.isLoggedIn(req.session.user_id)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    const inviterId = req.session.user_id;

    if (!req.body.inviteeId || !req.body.chatId) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }
    const inviteeId = req.body.inviteeId; // would it be id or name..?
    const chatId = req.session.chatId;

    try {
        // Insert the post into the database
        //  CHECK IF I CAN INSERT A NULL
        const postInvite = `INSERT INTO invites (chat_id, invitee_id, inviter_id, confirmed) VALUES ('${chatId}', '${inviteeId}', '${inviterId}', 0)`; // FALSE is 0
        await db.send_sql(postInvite);
        res.status(201).send({ message: "Invite sent." });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

// UPDATE /confirmInvite
var confirmInvite = async function(req, res) {
    // Check if the user is logged in
    if (!req.session.user_id || !helper.isLoggedIn(req.session.user_id)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    // check about chatId
    if (!req.body.inviteId || !req.body.chatId) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }

    const inviteId = req.body.inviteId;
    // either it's included or I might have to include it
    // maybe when you display it it's already in there
    const chatId = req.body.chatId;

    try {
        // Update the confirmation status in the database
        const updateQuery = `UPDATE invites SET confirmed = 1 WHERE invite_id = ${inviteId}`;
        await db.send_sql(updateQuery);

        // create new row in user chats
        const postUserChat = `INSERT INTO user_chats (user_id, chat_id) VALUES ('${req.session.user_id}', NULL, '${chatId}')`;
        await db.send_sql(postUserChat);

        res.status(200).json({ message: "Invite confirmation updated successfully." });
    } catch (error) {
        console.error('Error updating invite confirmation:', error);
        return res.status(500).json({ error: 'Error updating invite confirmation.' });
    }
}


// DELETE /deleteInvite
var deleteInvite = async function(req, res) {
    // Check if the user is logged in
    if (!req.session.user_id || !helper.isLoggedIn(req.session.user_id)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    if (!req.body.inviteId) {
        return res.status(400).json({ error: 'Invite ID is missing.' });
    }

    const inviteId = req.body.inviteId;

    try {
        const deleteQuery = `DELETE FROM invites WHERE invite_id = ${inviteId}`;
        await db.send_sql(deleteQuery);

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
var getFriendName = async function(req, res) {
    
    if (!helper.isLoggedIn(req.session.user_id)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    const userId = req.session.user_id;
    const friendName = req.body.friendName;

    // return a list of people with similar names
    const findUserQuery = `
    SELECT *
    FROM users
    WHERE username LIKE '%${friendName}%`;

    try {
        const searchRes = await db.send_sql(findUserQuery);
        if (searchRes.length <= 0) {
            // check error - maybe do an alert as well?
            return res.status(409).json({ error: 'NO USER WITH THIS USERNAME FOUND'});
        }
        // Send the response with the list of posts for the feed
        const results = searchRes.map(res => ({
            user_id: res.user_id,
            username: res.username,
            firstname: res.firstname,
            lastname: res.lastname,
            affiliation: res.lastname, 
            password: res.lastname,
            birthday: res.birthday,
            profile_photo: res.profile_photo
        }));
        res.status(200).json({results});
    } catch (err) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

// POST /postText
var postText = async function(req, res) {

    if (!req.session.user_id || !helper.isLoggedIn(req.session.user_id)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    const message = req.body.message;
    const senderId = req.session.user_id; // Assuming the user ID is stored in the session
    const inviteeId = req.body.inviteeId; // Assuming the invitee ID is provided in the request body
    const chatId = req.body.chatId; // Assuming the chat ID is provided in the request body

    try {
        // Insert the message into the database
        const insertQuery = `INSERT INTO messages (sender_id, message_content, chat_id) VALUES (?, ?, ?)`;
        await db.send_sql(insertQuery, [senderId, message, chatId]);

        // Insert the message into the invites table
        const inviteQuery = `INSERT INTO invites (chat_id, invitee_id, inviter_id, confirmed) VALUES (?, ?, ?, 0)`;
        await db.send_sql(inviteQuery, [chatId, inviteeId, senderId]);

        // Send a success response
        res.status(201).json({ message: "Message sent successfully." });
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
    get_chat_by_id: getChatById,
    get_chat_all: getChatAll,
    post_chat: postChat,
    post_text: postText,
    post_invite: postInvite,
    confirm_invite: confirmInvite,
    // get_friend_by_username: getFriendName
    post_selections: postSelections, 
    get_top_hashtags: getTopHashtags
  };
    
module.exports = routes;



// dummy post command
// INSERT INTO posts (title, content, author_id, timestamp, parent_post)
// VALUES ('Cant wait for summer', 'counting down the days...', 4, CURDATE(), NULL);
