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
const { Chroma } = require("@langchain/community/vectorstores/chroma");

const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const bcrypt = require('bcrypt'); 
const helper = require('../routes/route_helper.js');

// Database connection setup
const db = dbsingleton;

const PORT = config.serverPort;


var getHelloWorld = function(req, res) {
    res.status(200).send({message: "Hello, world!"});
}


var getVectorStore = async function(req) {
    if (vectorStore == null) {
        vectorStore = await Chroma.fromExistingCollection(new OpenAIEmbeddings(), {
            collectionName: "imdb_reviews2",
            url: "http://localhost:8000", // Optional, will default to this value
            });
    }
    return vectorStore;
}


// POST /register 
var postRegister = async function(req, res) {
    // TODO: register a user with given body parameters
    console.log('reg');
    if (!req.body.username || !req.body.password || !req.body.linked_id) {
        console.log('empty');
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }
    
    const username = req.body.username;
    const password = req.body.password;
    const linked_id = req.body.linked_id;
    
        // check if the account with username already exists or not:
    const exists = await db.send_sql(`SELECT * FROM users WHERE username = '${username}'`);
    if (exists.length > 0) {
        console.log('alr exist');
        return res.status(409).json({ error: 'An account with this username already exists, please try again.' });
    }

    let hashedPassword = password;
    
    try {
        hashedPassword = await helper.encryptPassword(password);
        console.log('Hashed password:', hashedPassword);
    } catch (err) {
        console.error('Error hashing password:', err);
        return res.status(500).json({ error: 'Error hashing password.' });
    }

        // changed check
    try {
        console.log('inserting user');
        await db.send_sql('INSERT INTO users (username, hashed_password, linked_nconst) VALUES (?, ?, ?)', [username, hashedPassword, linked_id]);
        console.log('done');
        return res.status(200).json({ username: username });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).jsroutes/routes.json({ error: 'Error querying database.' });
    }
    
    
    };
    /*
    console.log('registering');
    if (!req.body.username || !req.body.password || !req.body.linked_nconst) {
        console.log('null');
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }

    const username = req.body.username;
    const password = req.body.password;
    const linked_nconst = req.body.linked_nconst;

    // check if the account with username already exists or not:
    const exists = await db.send_sql('SELECT * FROM users WHERE username = ?', [username]);
    if (exists.length > 0) {
        return res.status(409).json({ error: 'An account with this username already exists, please try again.' });
    }

    try {
        const hashedPassword = await helper.encryptPassword(password);
        console.log('Hashed password:', hashedPassword);
        try {
            await db.send_sql('INSERT INTO users (username, hashed_password, linked_nconst) VALUES (?, ?, ?)', [username, hashedPassword, linked_nconst]);
            return res.status(200).json({ username: username });
        } catch (error) {
            console.error('Error querying database:', error);
            return res.status(500).json({ error: 'Error querying database.' });
        }
    } catch (err) {
        console.error('Error hashing password:', err);
        return res.status(500).json({ error: 'Error hashing password.' });
    }*/


//https://dev.to/przpiw/file-upload-with-react-nodejs-2ho7

var uploadPhoto = async function(req, res) {
    try {
        // Check if a file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Process the uploaded file, for example, save it to the database or filesystem
        var filePath = req.file.path;
        // You can use filePath to save the file location to the database or process it further

        // Send a success response
        return res.status(200).json({ message: 'File uploaded successfully', filePath: filePath });
    } catch (error) {
        console.error('Error uploading file:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


// POST /login
var postLogin = async function(req, res) {
    // TODO: check username and password and login
    
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }

    const username = req.body.username;
    const password = req.body.password;
    console.log('username: ', username);
    console.log('password: ', password);

    try {
        console.log('querying');
        const findUserQuery = `SELECT * FROM users WHERE username = '${username}'`;
        const user = await db.send_sql(findUserQuery);
        // const user = await db.send_sql('SELECT * FROM users WHERE username = ${username}', [username]);

        if (user.length === 0) {
            console.log('user has zero length');
            return res.status(401).json({ error: 'Username and/or password are invalid.' });
        }

        bcrypt.compare(password, user[0].hashed_password, function(err, result) {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).json({ error: 'Error comparing passwords.' });
            }
            if (result) {
                // successful
                console.log('success');
                req.session.user_id = user[0].user_id; // check this
                console.log('user id:, req.session.user_id');
                return res.status(200).json({ username: username });
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
var postLogout = function(req, res) {
  // TODO: fill in log out logic to disable session info
    req.session.user_id = null;
    // Send a response indicating successful logout
    res.status(200).json({ message: "You were successfully logged out." });

};


// GET /friends
var getFriends = async function(req, res) {

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
        const friends =  await db.send_sql(`SELECT DISTINCT friends.followed, nFriend.primaryName
        FROM names nUser
        JOIN users user1 ON user1.linked_nconst = nUser.nconst
        JOIN friends ON nUser.nconst = friends.follower
        JOIN names nFriend ON friends.followed = nFriend.nconst
        WHERE user1.user_id = '${req.session.user_id}'`);

        const results = friends.map(friend => ({
            followed: friend.followed,
            primaryName: friend.primaryName
        }));
        res.status(200).json({results});
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }

}

// GET /recommendations
var getFriendRecs = async function(req, res) {
    
    // TODO: get all friend recommendations of current user

    const {username} = req.params;

    
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

        res.status(200).json({results});
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }

}


// POST /createPost
var createPost = async function(req, res) {

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
    let parent_id = req.body.parent_id;
    if (!parent_id) {
        parent_id = "null";
    }

    // screen the title and content to be alphanumeric
    if (!helper.isOK(title) || !helper.isOK(content)) {
        return res.status(400).json({ error: 'Title and content should only contain alphanumeric characters, spaces, periods, question marks, commas, and underscores.' });
    }

    try {
        // Insert the post into the database
        const postQuery = `INSERT INTO posts (author_id, title, content, parent_post) VALUES ('${req.session.user_id}', '${title}', '${content}', '${parent_id}')`;
        await db.send_sql(postQuery);
        // 'INSERT INTO posts (parent_post, title, content, author_id) VALUES (?, ?, ?, ?)';
        // await db.send_sql(postQuery, [parent_id, title, content, author_id]);
        // Send the response indicating successful post creation
        res.status(201).send({ message: "Post created." });
    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }

}

// GET /feed
//Yes, authors that the current user follows, as well as
//any posts that the current user made. (just like how you can see your own posts in your Instagram feed)
var getFeed = async function(req, res) {
    console.log('getFeed is called');
    
    // TODO: get the correct posts to show on current user's feed
    if (!helper.isLoggedIn(req.session.user_id)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }
    const userId = req.session.user_id;

    console.log('curr id: ', req.session.user_id);
    // GRACE TODO: Check the tables
    try {
        console.log('trying');
        const feed = await db.send_sql(`
            SELECT posts.post_id, users.username, posts.parent_post, posts.title, posts.content
            FROM posts
            JOIN users ON posts.author_id = users.user_id
            WHERE posts.author_id = '${userId}' OR posts.author_id IN (
                SELECT followed FROM friends WHERE follower = '${userId}'
            )
            ORDER BY posts.post_id DESC
        `);

        // Send the response with the list of posts for the feed
        const results = feed.map(post => ({
            username: post.recommendation,
            parent_post: post.parent_post,
            tite: post.title,
            content: post.content
        }));
        res.status(200).json({results});

    } catch (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    } 

}

var getMovie = async function(req, res) {
    const vs = await getVectorStore();
    const retriever = vs.asRetriever();

    const prompt =
    PromptTemplate.fromTemplate({
        context: 'Based on the context: {context}, answer the question: {question}',
        contextParams: { context: req.body.context, question: req.body.question }
    });
    //const llm = null; // TODO: replace with your language model
    const llm = new ChatOpenAI({ apiKey: process.env.OPENAI_API_KEY, modelName: 'gpt-3.5-turbo', temperature: 0});

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
    res.status(200).json({message:result});
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
    upload_photo: uploadPhoto
  };


module.exports = routes;

