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
/* S3 Functions */
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const upload = multer({ dest: 'uploads/' }); 

const mysql = require('mysql2');
const session = require("express-session");
const client = new ChromaClient();
const parse = require('csv-parse').parse;
const csvContent = fs.readFileSync('/nets2120/project-stream-team/names.csv', 'utf8');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

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
// let session_user_id;

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

        files.forEach(function (file) {
            console.info("Adding task for " + file + " to index.");
            promises.push(facehelper.indexAllFaces(path.join("/nets2120/project-stream-team/models/images", file), file, collection));
        });

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
    console.log('logging in');

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
                session_user_id = req.session.user_id; // CHECK
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

var postOnline = async function (req, res) {

    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    try {
        const findUserQuery = `SELECT * FROM login WHERE user_id = ${session_user_id}`;
        const u = await db.send_sql(findUserQuery);
        let updateQuery;
        if (u.length === 0) {
            updateQuery = `INSERT INTO login (user_id, is_online) VALUES (${session_user_id}, 1)`;
        } else {
            updateQuery = `UPDATE login SET is_online = 1 WHERE user_id = ${session_user_id}`;
        }
        console.log('logging in');
        const logging = await db.send_sql(updateQuery);
        return res.status(200).json({ message: "logging in success" });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
 
}


// GET /logout
var postLogout = async function (req, res) {
    console.log('im logging out');
    const updateQuery = `UPDATE login SET is_online = 0 WHERE user_id = ${session_user_id}`;
    const logout = await db.send_sql(updateQuery);
    req.session.user_id = null;
    session_user_id = null; // CHECK ASK GRACE
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

// GET /userinfo
var getUserInfo = async function (req, res) {
    const username = req.params.username;
    console.log('getUserInfo called');
    console.log('getUserinfo username:', username);
    try {
        const query = `
            SELECT users.*, GROUP_CONCAT(hashtags.hashtagname) AS hashtags
            FROM users
            JOIN hashtag_by ON users.user_id = hashtag_by.user_id
            JOIN hashtags ON hashtag_by.hashtag_id = hashtags.hashtag_id
            WHERE username = '${username}'
            GROUP BY users.user_id
        `;
        const results = await db.send_sql(query);
        console.log('getTophashtags result', results);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error querying top hashtags:', error);
        res.status(500).json({ error: 'Error querying database for top hashtags.' });
    }
};

// POST /:username/changeActor
var changeActor = async function (req, res) {
    const username = req.params.username;
    const { newActor } = req.body;  // The new actor to link to the user

    console.log('changeActor called');
    console.log('changeActor username:', username);
    console.log('changeActor newActor:', newActor);

    if (!newActor) {
        return res.status(400).json({ error: 'A new actor must be provided.' });
    }

    try {
        const query = `
            UPDATE users
            SET linkedActor = '${newActor}'
            WHERE username = '${username}'
        `;
        const result = await db.send_sql(query);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No user found with the given username.' });
        }

        console.log('Actor changed successfully');
        res.status(200).json({ success: true, message: `${username} is now linked to ${newActor}` });
    } catch (error) {
        console.error('Error changing actor:', error);
        res.status(500).json({ error: 'Error updating database for actor change.' });
    }
};

// POST /:username/changeEmail
var changeEmail = async function (req, res) {
    const username = req.params.username;
    const { newEmail } = req.body;  

    console.log('changeEmail called');
    console.log('changeEmail username:', username);
    console.log('changeEmail newEmail:', newEmail);

    if (!newEmail) {
        return res.status(400).json({ error: 'A new email must be provided.' });
    }

    try {
        const query = `
            UPDATE users
            SET email = '${newEmail}'
            WHERE username = '${username}'
        `;
        const result = await db.send_sql(query);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No user found with the given username.' });
        }

        console.log('Email changed successfully');
        res.status(200).json({ success: true, message: `${username}'s email has been updated successfully.` });
    } catch (error) {
        console.error('Error changing email:', error);
        res.status(500).json({ error: 'Error updating database for email change.' });
    }
};


// POST /:username/changePassword
var changePassword = async function (req, res) {
    const username = req.params.username;
    const { newPassword } = req.body;  // The new password to update for the user

    console.log('changePassword called');
    console.log('changePassword username:', username);

    if (!newPassword) {
        return res.status(400).json({ error: 'A new password must be provided.' });
    }

    try {
        // Hash the new password before storing it
        const hashedPassword = await helper.encryptPassword(newPassword);

        const query = `
            UPDATE users
            SET password = ?
            WHERE username = ?
        `;
        const result = await db.send_sql(query, [hashedPassword, username]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No user found with the given username.' });
        }

        console.log('Password changed successfully');
        res.status(200).json({ success: true, message: `${username}'s password has been updated successfully.` });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Error updating database for password change.' });
    }
};

// POST /:username/changeHashtags
var changeHashtags = async function (req, res) {
    const username = req.params.username;
    const { hashtags } = req.body;  // Expected to be a comma-separated string of hashtags

    console.log('changeHashtags called');
    console.log('changeHashtags username:', username);
    console.log('changeHashtags:', hashtags);

    if (!hashtags) {
        return res.status(400).json({ error: 'Hashtags must be provided.' });
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

        await Promise.all(validHashtagIds.map(async (hashtagId) => {
            await db.send_sql(`INSERT INTO hashtag_by (user_id, hashtag_id) VALUES ('${userId}', '${hashtagId}')`);
        }));
        res.status(200).json({ success: true, message: `${username}'s hashtags have been updated successfully.` });
    } catch (error) {
        console.error('Error changing hashtags:', error);
        res.status(500).json({ error: 'Error updating database for hashtag change.' });
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
// getALLFRIENDS
var getUserByUsername = async function (req, res) {

    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    if (!req.query.friend_name) {
        return res.status(400).json({ error: 'Friend username is missing.' });
    }

    const friendName = req.query.friend_name;
    console.log('finding user with username', friendName);

    const findUserQuery = `
    SELECT *
    FROM users
    WHERE username LIKE '%${friendName}%'`;

    try {
        const users = await db.send_sql(findUserQuery);
        if (users.length <= 0) {
            return res.status(409).json({ error: 'No user with this name found!' });
        }
        const results = users.map(user => ({
            userId: user.user_id,
            username: user.username
        }));
        res.status(200).json({ results });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }

}

// GET /friends
// getALLFRIENDS
var getFriends = async function (req, res) {

    console.log('getting friends');

    if (!req.params.username) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    const username = req.params.username;
    

    // TODO: get all friends of current user
    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }
    const userId = session_user_id;

    try {
        const getFriendsQuery = ` WITH filtered_friends AS (
            SELECT * FROM friends WHERE follower = ${userId}
        ) 
        SELECT t1.followed, t2.username, t3.is_online
        FROM filtered_friends t1
        JOIN users t2 ON t1.followed = t2.user_id
        JOIN login t3 ON t3.user_id = t2.user_id
        `;

        const friends = await db.send_sql(getFriendsQuery);
        // followed data
        const results = friends.map(friend => ({
            followed: friend.followed,
            username: friend.username,
            is_online: friend.is_online
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

// GROUP-RELATED ROUTES

// POST /postGroup // used when creating one
var postGroup = async function(req, res) {
    console.log('creating a group');

    if (!req.body.group_name) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }
    const chatAdmin = session_user_id;
    // const chatAdmin = req.body.user_id;
    const chatName = req.body.group_name;

    // screen the title and content to be alphanumeric
    if (!helper.isOK(chatName)) {
        return res.status(400).json({ error: 'Groupname should only contain alphanumeric characters, spaces, periods, question marks, commas, and underscores.' });
    }

    try {
        const chatQuery = `INSERT INTO chats (chatname, admin_id, groupchat_name) VALUES ('${chatName}', '${chatAdmin}', '${chatName}')`;
        await db.send_sql(chatQuery);

        const countChatsQuery = `SELECT * FROM chats ORDER BY chat_id DESC LIMIT 1`;
        const countResult = await db.send_sql(countChatsQuery);
        const chatId = countResult[0].chat_id;

        const postQuery = `INSERT INTO communities (communities_name, chat_id, admin_id) VALUES ('${chatName}', ${chatId}, ${chatAdmin})`;
        await db.send_sql(postQuery);

        const countComsQuery = `SELECT * FROM communities ORDER BY communities_id DESC LIMIT 1`;
        const countResult1 = await db.send_sql(countComsQuery);
        const comId = countResult1[0].communities_id;

        // add chat and user relation
        const postUserGroup = `INSERT INTO user_communities (user_id, communities_id) VALUES ('${chatAdmin}', '${comId}')`;
        await db.send_sql(postUserGroup);
        // res.status(201).send({
        //     message: "group created.",
        //     com_id: comId
        // });

        const postUserChat = `INSERT INTO user_chats (user_id, chat_id, is_active) VALUES ('${chatAdmin}', '${chatId}', 1)`;
        await db.send_sql(postUserChat);
        return res.status(201).send({
            message: "chat and group added for user",
            chat_id: chatId,
            com_id: comId
        });

    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

// GET /friends
// getGroupsAll
var getGroupsAll = async function (req, res) {

    console.log('getting groups');

    if (!req.params.username) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    const username = req.params.username;
    
    // TODO: get all friends of current user
    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }
    const userId = session_user_id;

    try {
        const getGroupQuery = ` WITH filtered_coms AS (
            SELECT * FROM user_communities WHERE user_id = ${userId}
        ) 
        SELECT t1.communities_id, t2.communities_name, t2.chat_id, t2.admin_id
        FROM filtered_coms t1
        JOIN communities t2 ON t1.communities_id = t2.communities_id
        `;

        const friends = await db.send_sql(getGroupQuery);
        // followed data
        const results = friends.map(friend => ({
            communities_id: friend.communities_id,
            communities_name: friend.communities_name,
            chatId: friend.chat_id,
            adminId: friend.admin_id
        }));
        return res.status(200).json({ results });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }

}

// GET /friends
// getALLFRIENDS
var getGroupByName = async function (req, res) {

    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    if (!req.query.communities_name) {
        return res.status(400).json({ error: 'Friend username is missing.' });
    }

    const gName = req.query.communities_name;
    console.log('finding group with name', gName);

    const findGQuery = `
    SELECT *
    FROM communities
    WHERE communities_name LIKE '%${gName}%'`;

    try {
        const coms = await db.send_sql(findGQuery);
        if (coms.length <= 0) {
            return res.status(409).json({ error: 'No group with this name found!' });
        }
        const results = coms.map(com => ({
            cId: com.communities_id,
            cName: com.communities_name,
            chatId: com.chat_id,
            adminId: com.admin_id
        }));
        return res.status(200).json({ results });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

var joinGroup = async function(req, res) {
    console.log('joining a group');

    if (!req.body.groupId) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }
    const chatAdmin = session_user_id;
    // const chatAdmin = req.body.user_id;
    const groupId = req.body.groupId;

    try {
        const countChatsQuery = `SELECT * FROM communities WHERE communities_id = ${groupId}`;
        const countResult = await db.send_sql(countChatsQuery);
        const chatId = countResult[0].chat_id;

        // add chat and user relation
        const postUComChat = `INSERT INTO user_communities (user_id, communities_id) VALUES ('${chatAdmin}', '${groupId}')`;
        await db.send_sql(postUComChat);

        const postUserChat = `INSERT INTO user_chats (user_id, chat_id, is_active) VALUES ('${chatAdmin}', '${chatId}', 1)`;
        await db.send_sql(postUserChat);
        return res.status(201).send({
            message: "joined group chat successfully.",
        });

    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

// DELETE /leaveGroup
var leaveGroup = async function(req, res) {
    // Check if the user is logged in
    // console.log('leaving chatroom with req', req);
    if (!session_user_id) {
    // if (!req.session.user_id || !helper.isLoggedIn(req.session.user_id)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    if (!req.body.groupId) {
        return res.status(400).json({ error: 'chat ID is missing.' });
    }

    const user_id = session_user_id;

    // const user_id = req.session.user_id;
    const groupId = req.body.groupId;

    try {
        const getChatIdQuery = `SELECT * FROM communities WHERE communities_id = ${groupId}`;
        const chatRed = await db.send_sql(getChatIdQuery);
        const chatId = chatRed[0].chat_id;
        console.log('chat id is ', chatId);

        const deleteQuery = `DELETE FROM user_communities WHERE user_id = ${user_id} AND communities_id = ${groupId}`;
        await db.send_sql(deleteQuery);

        const deleteChatQuery = `DELETE FROM user_chats WHERE user_id = ${user_id} AND chat_id = ${chatId}`;
        await db.send_sql(deleteChatQuery);

        res.status(200).json({ message: "Left group and chatroom successfully." });
    } catch (error) {
        console.error('Error deleting group membership:', error);
        return res.status(500).json({ error: 'Error leaving group chatroom.' });
    }
}



/// POST /createPost
var createPost = async function (req, res) {
    console.log('creating post right now');
    if (!session_user_id) {
      return res.status(403).json({ error: 'Not logged in.' });
    }
    // console.log(req.body);

    console.log('Received fields:', req.body);
    console.log('Received file:', req.file);

    const { title, hashtags } = req.body;
    const content = req.file; // treating content as imageURL for now, TODO: create table field

    // console.log(title);
    console.log("hi");
    console.log(hashtags);
    // console.log(content);
    // let content = req.file;  // Assuming content is a file uploaded and parsed by middleware like `multer`
    // let parent_id = req.body.parent_post || null;
  
    console.log("Checking title: ", title);
    // console.log("Checking original filename: ", content.originalname);
    if (!helper.isOK(title) || (content && !helper.isOK(content.originalname))) {
        console.log("here");
      return res.status(400).json({ error: 'Invalid characters in title or file name.' });
    }

    // if (content) {
    //     console.log("Checking original filename: ", content.originalname);
    //     if (!helper.isOK(content.originalname)) {  // Validate file name if content is a file)
    //         return res.status(400).json({ error: 'Invalid characters in title or file name.' });
    //     }
    // }

    try {
      const postQuery = `INSERT INTO posts (author_id, title, content, timestamp) VALUES (?, ?, ?, NOW())`;
      const postResult = await db.send_sql(postQuery, [req.session.user_id, title, content.path]); // Assuming `content.path` is where the file is stored
      const newPostId = postResult.insertId;
      console.log("inputted");
  
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

    // if (!req.session.user_id) {  // Ensuring user is logged in
    //     return res.status(403).json({ error: 'Not logged in.' });
    // }
    // if (!req.session.user_id) {  // Ensuring user is logged in
    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    // const userId = req.session.user_id;
    const userId = session_user_id;
    console.log('curr id: ', userId);

    // ask if we need anything from comments_on)post_by
    
    try {
        console.log('trying to fetch feed');
        //BELOW IS MY EDIT
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
                comments c ON c.post_id = p.post_id
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
    console.log('getChatAll is called');

    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    console.log('req ', req.session);
    console.log('req ', req.session.user_id);
    // user_id = req.query.user_id;
    user_id = session_user_id;
    console.log('curr id: ', user_id);
    // GRACE TODO: Check the tables
    try {
        // maybe I should add a last text entry to chat so we can keep track?
        // last text id so that it is easier to display too
        console.log('trying');

        // MADE EDITS HERE CHECK  

        const getChatQuery = `
        WITH chat_agg AS (
            SELECT t1.chat_id, t1.user_id, t1.is_active
            FROM user_chats t1
            JOIN (SELECT * FROM user_chats WHERE user_id = ${user_id} and is_active = 1) t2
            ON t1.chat_id = t2.chat_id
        ), with_name AS (
            SELECT t1.chat_id, t2.username
            FROM (SELECT * FROM chat_agg WHERE is_active = 1) t1
            JOIN users t2 ON t1.user_id = t2.user_id
        ), users_agg AS (
            SELECT chat_id, GROUP_CONCAT(username SEPARATOR ', ') AS users
            FROM with_name
            GROUP BY chat_id
        )      
        SELECT t1.chat_id, t1.users, t2.groupchat_name
        FROM users_agg t1
        JOIN chats t2 ON t1.chat_id = t2.chat_id
        `;

        const allChats = await db.send_sql(getChatQuery);
        console.log('all chats backend', allChats);

        // Send the response with the list of posts for the feed
        const results = allChats.map(chat => ({
            chat_id: chat.chat_id,
            chatname: chat.users,
            groupchat_name: chat.groupchat_name
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
        const countChatsQuery = `SELECT * FROM chats ORDER BY chat_id DESC LIMIT 1`;
        const countResult = await db.send_sql(countChatsQuery);
        const chatId = countResult[0].chat_id;

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

    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }
    user_id = session_user_id;
    console.log('curr id: ', user_id);
    // GRACE TODO: Check the tables
    try {
        console.log('invite trying');
        const getInviteQuery = `
        WITH invite_agg AS (
            SELECT i1.invite_id, i1.chat_id, i1.invitee_id, i1.inviter_id, i1.confirmed, i1.is_groupchat
            FROM invites i1
            JOIN (SELECT * FROM user_invites WHERE user_id = ${user_id}) i2
            ON i1.invite_id = i2.invite_id
        )
        SELECT t1.invite_id, t1.inviter_id, t2.username, t1.confirmed, t1.is_groupchat, t1.chat_id
        FROM invite_agg t1
        JOIN users t2 ON t1.inviter_id = t2.user_id
        `;
        const allInvites = await db.send_sql(getInviteQuery);
        console.log('all invites backend', allInvites);

        const results = allInvites.map(invite => ({
            inviterName: invite.username,
            inviteId: invite.invite_id,
            inviterId: invite.inviter_id,
            chatroomName: invite.chatname,
            confirmed: invite.confirmed,
            is_groupchat: invite.is_groupchat,
            chatId: invite.chat_id
        }));
        console.log('invite results backend', results);
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
    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }
    // if (!req.session.user_id || !helper.isLoggedIn(req.session.user_id)) {
    //     return res.status(403).json({ error: 'Not logged in.' });
    // }
    const inviterId =session_user_id;
    console.log('this is req', req);

    // const inviterId = req.session.user_id;

    if (!req.body.invitee_id) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }
    const inviteeId = req.body.invitee_id; // would it be id or name..?
    try {
        console.log('trying post invite');
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
        console.log('this is check', check);
        if (check.length > 0) {
            const existing_chat_id = check[0].chat_id;
            console.log('existing_chat_id', existing_chat_id);
            try {
                console.log('checking if active or not');
                const checkActive = `SELECT * FROM user_chats WHERE chat_id = ${existing_chat_id}`;
                const active = await db.send_sql(checkActive);
                console.log('this is active', active);
                if (active.length > 0) {
                    // this means chat already exist
                    console.log('chat already exists');
                    const activeStatus = active.find(user => user.user_id === inviterId)?.is_active;
                    if (activeStatus) {
                        return res.status(409).json({ error: 'Chat session already exists' });
                    } else {
                        // have them rejoin the chat
                        console.log('joining an old chat');
                        const update = `UPDATE user_chats SET is_active = 1 WHERE user_id = ${user_id} AND chat_id = ${existing_chat_id}`;
                        await db.send_sql(update);
                        return res.status(201).send({ message: "Rejoined old chat!" });
                    } 
                } 
            } catch (err) {
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
        const postInvite = `INSERT INTO invites (invitee_id, inviter_id, confirmed, is_groupchat) VALUES ('${inviteeId}', '${inviterId}', 0, 0)`; // FALSE is 0

        await db.send_sql(postInvite);

        const countInvQuery = `SELECT * FROM invites ORDER BY invite_id DESC LIMIT 1`;
        const countResult = await db.send_sql(countInvQuery);
        const inviteId = countResult[0].invite_id;
        console.log('adding invite with id',inviteId );

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

    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    const inviterId = session_user_id;
    // const inviterId = req.query.user_id;

    if (!req.body.chat_id || !req.body.invitee_id) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }

    const inviteeId = req.body.invitee_id; // would it be id or name..?
    const chatId = req.body.chat_id;

    console.log('this is chat_id', chatId);
    try {
        const checkInvite = `WITH agg AS (
            SELECT DISTINCT chat_id,
            GROUP_CONCAT(user_id ORDER BY user_id) AS user_ids
            FROM user_chats
            GROUP BY chat_id
        )
        SELECT * FROM agg WHERE chat_id = ${chatId}`;
        const currChatMembers = await db.send_sql(checkInvite);
        console.log('old list', currChatMembers);
        // map it and concat our current chatId into it

        const userIdsString = currChatMembers[0].user_ids 
        console.log('old list 1', userIdsString);
        const userIdsArray = userIdsString.split(',').map(id => parseInt(id));
        userIdsArray.push(inviteeId);
        userIdsArray.sort((a, b) => a - b);
        const newChatMembers = userIdsArray.join(',');
        console.log('new list', newChatMembers)

        const userChats = `WITH agg AS (
            SELECT DISTINCT t.chat_id,
            GROUP_CONCAT(t.user_id ORDER BY t.user_id) AS user_ids
            FROM (SELECT * FROM user_chats WHERE is_active = 1) t
            GROUP BY t.chat_id
        )
        SELECT * FROM agg WHERE user_ids = '${newChatMembers}'
        `;
        const check = await db.send_sql(userChats);

        if (check.length > 0) {
            return res.status(409).json({ error: 'User is already in chat! Please add another user!' });
        } else {
            console.log('inserting invite');
            try {
                // TODO: CHECK WHY THERE ARE TWO INVITES RN
                const postInvite = `INSERT INTO invites (invitee_id, chat_id, inviter_id, confirmed, is_groupchat) VALUES ('${inviteeId}', '${chatId}', '${inviterId}', 0, 1)`;
                
                await db.send_sql(postInvite);
                console.log('invite post 1');

                // const getInviteId = `SELECT LAST_INSERT_ID() AS invite_id`;
                const getInviteId = `SELECT * FROM invites ORDER BY invite_id DESC LIMIT 1`;
                const r1 = await db.send_sql(getInviteId);
                const inviteId = r1[0].invite_id;
                console.log('inviteId for post', inviteId);
                try {
                    //  check if I need quotations for this or not
                    const postUInvite = `INSERT INTO user_invites (user_id, invite_id) VALUES (${inviteeId}, ${inviteId})`;
                    const r2 = await db.send_sql(postUInvite);
                    console.log('invite post 2');

                } catch(err) {
                    console.error('Error querying database:', err);
                    return res.status(500).json({ error: 'Error querying database.' });
                }
                // const check = await db.send_sql(checkChat);
            } catch (err) {
                console.error('Error querying database:', err);
                return res.status(500).json({ error: 'Error querying database.' });
            }
        }
    } catch (err) {
        console.error('Error querying database:', err);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}


// UPDATE /confirmInvite
var confirmInvite = async function(req, res) {
    // Check if the user is logged in
    console.log('confirming invite');
    // console.log('req', req);

    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    if (!req.body.params.inviteId || !req.body.params.adminId) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }

    const inviteId = req.body.params.inviteId;
    const adminId = req.body.params.adminId;
    const user_id = session_user_id;

    try {
        console.log('inside try');
        // Update the confirmation status in the database
        const updateQuery = `UPDATE invites SET confirmed = 1 WHERE invite_id = ${inviteId}`;
        await db.send_sql(updateQuery);

        const postChat = `INSERT INTO chats (chatname, admin_id) VALUES ('${adminId}', '${adminId}')`;
        await db.send_sql(postChat);

        const getChatIdQuery = `SELECT * FROM chats ORDER BY chat_id DESC LIMIT 1`;

        // const getChatIdQuery = `SELECT LAST_INSERT_ID() AS chat_id`;
        const r1 = await db.send_sql(getChatIdQuery);
        const chatId = r1[0].chat_id;
        console.log('insert this as chatId', chatId);

        // create new row in user chats
        const postUserChat = `INSERT INTO user_chats (user_id, chat_id, is_active) VALUES ('${user_id}', '${chatId}', 1)`;
        await db.send_sql(postUserChat);
        const postAdminChat = `INSERT INTO user_chats (user_id, chat_id, is_active) VALUES ('${adminId}', '${chatId}', 1)`;
        await db.send_sql(postAdminChat);
        // also have to insert this for the admin_id
        // should add a delete... as well
        console.log('done');

        res.status(200).json({ message: "Invite confirmation updated successfully and posted." });
    } catch (error) {
        console.error('Error updating invite confirmation:', error);
        return res.status(500).json({ error: 'Error updating invite confirmation.' });
    }
}


// UPDATE /confirmInvite
var confirmInviteChat = async function(req, res) {
    // Check if the user is logged in
    console.log('confirming invite chat');

    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    if (!req.body.params.inviteId || !req.body.params.adminId || !req.body.params.chatId) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }

    const inviteId = req.body.params.inviteId;
    const adminId = req.body.params.adminId;
    const chatId = req.body.params.chatId;
    const user_id = session_user_id;

    try {
        const updateQuery = `UPDATE invites SET confirmed = 1 WHERE invite_id = ${inviteId}`;
        await db.send_sql(updateQuery);

        // create new row in user chats
        const postUserChat = `INSERT INTO user_chats (user_id, chat_id, is_active) VALUES ('${user_id}', '${chatId}', 1)`;
        await db.send_sql(postUserChat);
        console.log('done');

        res.status(200).json({ message: "Invite confirmation updated successfully and posted." });
    } catch (error) {
        console.error('Error updating invite confirmation:', error);
        return res.status(500).json({ error: 'Error updating invite confirmation.' });
    }
}


// DELETE /leaveChatroom
var leaveChatroom = async function(req, res) {
    // Check if the user is logged in
    console.log('leaving chatroom with req', req);
    if (!session_user_id) {
    // if (!req.session.user_id || !helper.isLoggedIn(req.session.user_id)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    if (!req.body.chatId) {
        return res.status(400).json({ error: 'chat ID is missing.' });
    }

    const user_id = session_user_id;

    // const user_id = req.session.user_id;
    const chatId = req.body.chatId;

    try {
        const deleteQuery = `UPDATE user_chats SET is_active = 0 WHERE user_id = ${user_id} AND chat_id = ${chatId}`;
        // const deleteQuery = `DELETE FROM user_chats WHERE user_id = ${user_id} AND chat_id = ${chatId}`;
        // might also have to delete from user_invites unless foreign key already does tht>
        await db.send_sql(deleteQuery);

        res.status(200).json({ message: "Left chatroom successfully." });
    } catch (error) {
        console.error('Error deleting invite:', error);
        return res.status(500).json({ error: 'Error leaving chatroom.' });
    }
}


// DELETE /deleteInvite
var deleteUInvite = async function(req, res) {
    // Check if the user is logged in
    console.log('delete u invite is called');
    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    if (!req.body.params.inviteId) {
        return res.status(400).json({ error: 'Invite ID is missing.' });
    }

    const inviteId = req.body.params.inviteId;
    const user_id = session_user_id;
    // const user_id = req.query.user_id;

    try {

        const deleteUInvite = `DELETE FROM user_invites WHERE invite_id = ${inviteId} AND user_id = ${user_id}`;
        await db.send_sql(deleteUInvite);
        console.log('success u delete')
        res.status(200).json({ message: "Invite deleted successfully." });
    } catch (error) {
        console.error('Error deleting invite:', error);
        return res.status(500).json({ error: 'Error deleting invite.' });
    }
}



// DELETE /deleteInvite
var deleteInvite = async function(req, res) {
    // Check if the user is logged in
    console.log('delete invite is called');
    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    // console.log('delete invite req', req);

    if (!req.body.params.inviteId) {
        return res.status(400).json({ error: 'Invite ID is missing.' });
    }

    const inviteId = req.body.params.inviteId;
    const user_id = session_user_id;
    // const user_id = req.query.user_id;

    try {
        const deleteQuery = `DELETE FROM invites WHERE invite_id = ${inviteId}`;
        // might also have to delete from user_invites unless foreign key already does tht>
        await db.send_sql(deleteQuery);

        console.log('delete success');
        res.status(200).json({ message: "Invite deleted successfully." });
    } catch (error) {
        console.error('Error deleting invite:', error);
        return res.status(500).json({ error: 'Error deleting invite.' });
    }
}


// DELETE /deleteInvite
var deleteUFInvite = async function(req, res) {
    // Check if the user is logged in
    console.log('delete fu invite is called');
    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    if (!req.body.params.inviteId) {
        return res.status(400).json({ error: 'Invite ID is missing.' });
    }

    const inviteId = req.body.params.inviteId;
    const user_id = session_user_id;
    // const user_id = req.query.user_id;

    try {

        const deleteUInvite = `DELETE FROM user_f_invites WHERE f_invite_id = ${inviteId} AND user_id = ${user_id}`;
        await db.send_sql(deleteUInvite);
        console.log('success u delete')
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

    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    // const user_id = req.session.user_id;
    const user_id = session_user_id;
    // const user_id = req.query.user_id;
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


// GET /chat
/** getChat 
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns -> retrieves all the current chats that users have
 */
var getFInviteAll = async function (req, res) {
    console.log('getFInviteAll is called');

    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }
    user_id = session_user_id;
    console.log('curr id: ', user_id);
    try {
        const getInviteQuery = `
        WITH invite_agg AS (
            SELECT i1.f_invite_id, i1.sender_id, i1.receiver_id, i1.confirmed
            FROM friend_invites i1
            JOIN (SELECT * FROM user_f_invites WHERE user_id = ${user_id}) i2
            ON i1.f_invite_id = i2.f_invite_id
        )
        SELECT t1.f_invite_id, t1.sender_id, t2.username, t1.confirmed
        FROM invite_agg t1
        JOIN users t2 ON t1.sender_id = t2.user_id
        `;
        const allInvites = await db.send_sql(getInviteQuery);

        const results = allInvites.map(invite => ({
            inviterName: invite.username,
            inviteId: invite.f_invite_id,
            inviterId: invite.sender_id,
            confirmed: invite.confirmed,
        }));
        console.log('results backend', results);
        res.status(200).json({ results });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }

}

// POST /postInvite
var postFInvite = async function(req, res) {
    // TODO: add to posts table
    console.log('posting f invite', req);
    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    const inviterId =session_user_id;
    console.log('1');

    if (!req.body.invitee_id) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }
    const inviteeId = req.body.invitee_id; // would it be id or name..?
    console.log('2');
    try {
        // Insert the post into the database
        //  DELETE CHAT-ID FROM IT
        const postInvite = `INSERT INTO friend_invites (sender_id, receiver_id, confirmed) VALUES ('${inviterId}', '${inviteeId}', 0)`; // FALSE is 0
        await db.send_sql(postInvite);

        // const getInviteId = `SELECT LAST_INSERT_ID() AS invite_id`;
        const getInviteId = `SELECT * FROM friend_invites ORDER BY f_invite_id DESC LIMIT 1`;
        const r1 = await db.send_sql(getInviteId);
        const inviteId = r1[0].f_invite_id;
        console.log('inserting this as invite', inviteId);

        const postUInvite = `INSERT INTO user_f_invites (user_id, f_invite_id) VALUES ('${inviteeId}', '${inviteId}')`; // FALSE is 0
        await db.send_sql(postUInvite);
        res.status(201).send({ message: "Invite sent." });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

// UPDATE /confirmInvite
var confirmFInvite = async function(req, res) {
    // Check if the user is logged in
    console.log('confirming f invite');

    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    if (!req.body.params.inviteId || !req.body.params.adminId) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }

    const inviteId = req.body.params.inviteId;
    const adminId = req.body.params.adminId;
    const user_id = session_user_id;

    try {
        // Update the confirmation status in the database
        const updateQuery = `UPDATE friend_invites SET confirmed = 1 WHERE f_invite_id = ${inviteId}`;
        await db.send_sql(updateQuery);

        const postFriend = `INSERT INTO friends (followed, follower) VALUES ('${user_id}', '${adminId}')`;
        await db.send_sql(postFriend);

        const postFriend2 = `INSERT INTO friends (followed, follower) VALUES ('${adminId}', '${user_id}')`;
        await db.send_sql(postFriend2);

        console.log('done');

        res.status(200).json({ message: "Friend invite confirmation updated successfully and posted." });
    } catch (error) {
        console.error('Error updating invite confirmation:', error);
        return res.status(500).json({ error: 'Error updating invite confirmation.' });
    }
}

// DELETE /deleteInvite
var deleteUInvite = async function(req, res) {
    // Check if the user is logged in
    console.log('delete u invite is called');
    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    if (!req.body.params.inviteId) {
        return res.status(400).json({ error: 'Invite ID is missing.' });
    }

    const inviteId = req.body.params.inviteId;
    const user_id = session_user_id;
    // const user_id = req.query.user_id;

    try {

        const deleteUInvite = `DELETE FROM user_invites WHERE invite_id = ${inviteId} AND user_id = ${user_id}`;
        await db.send_sql(deleteUInvite);
        console.log('success u delete')
        res.status(200).json({ message: "Invite deleted successfully." });
    } catch (error) {
        console.error('Error deleting invite:', error);
        return res.status(500).json({ error: 'Error deleting invite.' });
    }
}



// DELETE /deleteInvite
var deleteFInvite = async function(req, res) {
    // Check if the user is logged in
    console.log('delete f invite is called');
    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    // console.log('delete invite req', req);

    if (!req.body.params.inviteId) {
        return res.status(400).json({ error: 'Invite ID is missing.' });
    }

    const inviteId = req.body.params.inviteId;

    try {
        const deleteQuery = `DELETE FROM friend_invites WHERE f_invite_id = ${inviteId}`;
        // might also have to delete from user_invites unless foreign key already does tht>
        await db.send_sql(deleteQuery);

        console.log('finvite delete success');
        res.status(200).json({ message: "Invite deleted successfully." });
    } catch (error) {
        console.error('Error deleting invite:', error);
        return res.status(500).json({ error: 'Error deleting invite.' });
    }
}


// post /removeFriend
// remove both followed, follower
var removeFriend = async function(req, res) {
    // Check if the user is logged in
    console.log('removing friend');

    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    if (!req.body.friendId) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }

    const friendId = req.body.friendId;
    const user_id = session_user_id;

    try {
        // Update the confirmation status in the database
        // TODO: WHAT HAPPENS TO CHAT?
        // DELETE chat_id and user_id where chat-id is in both?
        const updateQuery = `DELETE FROM friends
        WHERE (followed = ${user_id} AND follower = ${friendId})
           OR (followed = ${friendId} AND follower = ${user_id});`;

        await db.send_sql(updateQuery);

        res.status(200).json({ message: "Friend deleted!" });
    } catch (error) {
        console.error('Error updating invite confirmation:', error);
        return res.status(500).json({ error: 'Error updating invite confirmation.' });
    }
}


// POST /friends 
// LET THIS BE THE ACCEPT ONE
var addFriends = async function (req, res) {

    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    if (!req.query.friend_id || !req.query.inviteId) {
        return res.status(400).json({ error: 'Friend id is missing.' });
    }

    const userId = session_user_id;
    const friendId = req.query.friend_id;
    const inviteId = req.query.inviteId;
    console.log('adding friendId as friend', friendId);

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

    console.log('user id', session_user_id);
    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }
    console.log('this is the req being sent', req);
    const author_id = session_user_id;
    const chat_id = req.body.chat_id;
    const timestamp = req.body.timestamp;
    const content = req.body.content;

    try {
        // Insert the message into the database
        const insertQuery = `INSERT INTO texts (author_id, chat_id, content, timestamp) VALUES (${author_id}, ${chat_id}, '${content}', '${timestamp}')`;
        await db.send_sql(insertQuery);

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

// POST /likePost
var likePost = async function(req, res) {

    console.log('posting likes');

    console.log('user id', session_user_id);
    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    console.log('this is the req being sent', req);

    const author_id = session_user_id;
    const post_id = req.body.post_id;

    try {
        // Insert the message into the database
        const insertQuery = `INSERT INTO posts_liked_by (liker_id, post_id) VALUES (${author_id}, ${post_id})`;
        await db.send_sql(insertQuery);

        res.status(201).json({ message: "Like sent successfully." });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}


// POST /unlikePost
var unlikePost = async function(req, res) {

    console.log('unliking post');

    console.log('user id', session_user_id);
    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    console.log('this is the req being sent', req);

    const author_id = session_user_id;
    const post_id = req.body.post_id;

    try {

        // Insert the message into the database
        const deleteUInvite = `DELETE FROM posts_liked_by WHERE liker_id = ${author_id} AND post_id = ${post_id}`;
        // const insertQuery = `DELETE FROM posts_liked_by (liker_id, post_id) VALUES (${author_id}, ${post_id})`;
        await db.send_sql(deleteUInvite);

        res.status(201).json({ message: "Like deleted sent successfully." });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}


// POST /postComment
var postComment = async function(req, res) {

    console.log('sending comment');
    console.log('user id', session_user_id);

    if (!session_user_id) {
        return res.status(403).json({ error: 'Not logged in.' });
    }
    // console.log('this is the req being sent', req);

    const author_id = session_user_id;
    const timestamp = req.body.timestamp; // are we doing this?
    const content = req.body.content;
    const post_id = req.body.post_id;

    try {
        // Insert the message into the database
        const insertQuery = `INSERT INTO comments (content, timestamp, post_id, author_id) VALUES ('${content}', '${timestamp}', ${post_id}, ${author_id})`;
        await db.send_sql(insertQuery);

        // // Insert the message into the invites table - PROBA won't need this?
        // await db.send_sql(inviteQuery, [chatId, inviteeId, senderId]);

        // Send a success response
        res.status(201).json({ message: "Comment sent successfully." });
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
    get_user_info: getUserInfo, 
    change_actor: changeActor, 
    change_email: changeEmail,
    change_password: changePassword,
    change_hashtags: changeHashtags,
    // upload_photo : uploadPhoto,
    get_chat_by_id: getChatById,
    get_chat_all: getChatAll,
    post_chat: postChat,
    post_text: postText,
    post_invite_chat: postInviteChat,
    get_invite_all: getInviteAll,
    post_invite: postInvite,
    confirm_invite: confirmInvite,
    confirm_inivte_chat: confirmInviteChat,
    add_friends: addFriends,
    get_friend_by_username: getFriendName,
    delete_invite: deleteInvite,
    delete_u_invite: deleteUInvite,
    leave_chatroom: leaveChatroom,
    get_text_by_chat_id: getTextByChatId,
    get_user_by_username: getUserByUsername,
    post_f_invite: postFInvite,
    get_f_invite_all: getFInviteAll,
    confirm_f_invite: confirmFInvite,
    delete_f_invite: deleteFInvite,
    delete_u_f_invite: deleteUFInvite,
    remove_friend: removeFriend,
    post_online: postOnline,
    like_post: likePost,
    unlike_post: unlikePost,
    post_comment: postComment,
    // group-related routes
    post_group: postGroup,
    get_groups_all: getGroupsAll,
    get_group_by_name: getGroupByName,
    join_group: joinGroup,
    leave_group: leaveGroup
  };


module.exports = routes;



// dummy post command
// INSERT INTO posts (title, content, author_id, timestamp, parent_post)
// VALUES ('Cant wait for summer', 'counting down the days...', 4, CURDATE(), NULL);
