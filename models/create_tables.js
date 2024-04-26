const dbaccess = require('./db_access');
const config = require('../config.json'); // Load configuration

function sendQueryOrCommand(db, query, params = []) {
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

async function create_tables(db) {
  // These tables should already exist from prior homeworks.
  // We include them in case you need to recreate the database.

  // do we uncomment them and create a new one for the project?

  // You'll need to define the names table.
  // var qa = db.create_tables('...');

    var qusers = db.create_tables('CREATE TABLE IF NOT EXISTS users ( \
      user_id INT AUTO_INCREMENT PRIMARY KEY, \
      username VARCHAR(255), \
      firstname VARCHAR(255), \
      lastname VARCHAR(255), \
      affiliation VARCHAR(255), \
      password VARCHAR(255), \
      birthday date, \
      profile_photo BLOB, \
    );')

    var qrecs = db.create_tables('CREATE TABLE IF NOT EXISTS recommendations ( \
      person INT, \
      recommendation INT, \
      strength int, \
      FOREIGN KEY (person) REFERENCES users(users_id), \
      FOREIGN KEY (recommendation) REFERENCES users(user_id) \
    );')
  
    var qposts = db.create_tables('CREATE TABLE IF NOT EXISTS posts ( \
      post_id INT AUTO_INCREMENT PRIMARY KEY,\
      title VARCHAR(255),\
      content VARCHAR(500), \
      author_id INT, \
      timestamp DATE, \
      FOREIGN KEY (author_id) REFERENCES users(user_id) \
      );'
    );

    // establishing the likes relationship
    var qpostslikers = db.create_tables('CREATE TABLE IF NOT EXISTS posts_liked_by ( \
      liker_id INT, \
      post_id INT, \
      FOREIGN KEY (liker_id) REFERENCES users(user_id), \
      FOREIGN KEY (post_id) REFERENCES posts(post_id) \
    );')

    // establishing the likes comments relationship for post and commenter
    var qcommenters = db.create_tables('CREATE TABLE IF NOT EXISTS comments_on_post_by ( \
      comment_id INT, \
      post_id INT, \
      author_id INT, \
      FOREIGN KEY (author_id) REFERENCES users(user_id), \
      FOREIGN KEY (post_id) REFERENCES posts(post_id), \
      FOREIGN KEY (comment_id) REFERENCES comments(comment_id) \
    );')

    // establishing the tagging relationship for post and tag(s)
    var qposttags = db.create_tables('CREATE TABLE IF NOT EXISTS post_tagged_with ( \
      post_id INT, \
      hashtag_id INT, \
      FOREIGN KEY (post_id) REFERENCES posts(post_id), \
      FOREIGN KEY (hashtag_id) REFERENCES hashtags(hashtag_id) \
    );')

    // establishing the tagging relationship for user and tag(s)
    var qusertags = db.create_tables('CREATE TABLE IF NOT EXISTS hashtag_by ( \
      hashtag_id INT, \
      user_id INT, \
      FOREIGN KEY (user_id) REFERENCES users(user_id), \
      FOREIGN KEY (hashtag_id) REFERENCES hashtags(hashtag_id) \
    );')

    var qusertags = db.create_tables('CREATE TABLE IF NOT EXISTS hashtags ( \
      hashtag_id INT AUTO_INCREMENT PRIMARY KEY,\
      hashtagname VARCHAR(255), \
    );')

    /**** chat-related table ***/
    // ADDED CHECK
    // update it whenever you send somethiing
    var qchats = db.create_tables('CREATE TABLE IF NOT EXISTS chats ( \
      chat_id INT AUTO_INCREMENT PRIMARY KEY, \
      chatname VARCHAR(255), \
      latest_text_id INT,\
      FOREIGN KEY (latest_text_id) REFERENCES texts(text_id) \
    );')

    // establishing the chat users in there
    var quserchats = db.create_tables('CREATE TABLE IF NOT EXISTS user_chats ( \
      user_id INT, \
      chat_id INT, \
      FOREIGN KEY (user_id) REFERENCES users(user_id), \
      FOREIGN KEY (chat_id) REFERENCES chats(chat_id) \
    );')

    var qtexts = db.create_tables('CREATE TABLE IF NOT EXISTS texts ( \
      text_id INT AUTO_INCREMENT PRIMARY KEY, \
      author_id INT, \
      chat_id INT, \
      content VARCHAR(500), \
      timestamp DATE, \
      FOREIGN KEY (author_id) REFERENCES users(users_id), \
      FOREIGN KEY (chat_id) REFERENCES chats(chat_id) \
    );')

    var qinvites = db.create_tables('CREATE TABLE IF NOT EXISTS invites ( \
      invite_id INT AUTO_INCREMENT PRIMARY KEY, \
      chat_id INT, \
      invitee_id INT, \
      inviter_id INT, \
      confirmed BOOLEAN, \
      FOREIGN KEY (invitee_id) REFERENCES users(users_id), \
      FOREIGN KEY (inviter_id) REFERENCES users(users_id), \
      FOREIGN KEY (chat_id) REFERENCES chats(chat_id) \
    );')

    var quserinvites = db.create_tables('CREATE TABLE IF NOT EXISTS user_invites ( \
      user_id INT, \
      invite_id INT, \
      FOREIGN KEY (user_id) REFERENCES users(users_id) \
      FOREIGN KEY (invite_id) REFERENCES invites(invite_id) \
    );')

    var qfriends = db.create_tables('CREATE TABLE IF NOT EXISTS friends ( \
      followed INT, \
      follower INT \
      FOREIGN KEY (follower) REFERENCES users(user_id), \
      FOREIGN KEY (followed) REFERENCES users(user_id) \
      );')
  
    var qcomments = db.create_tables('CREATE TABLE IF NOT EXISTS comments ( \
      comment_id INT AUTO_INCREMENT PRIMARY KEY, \
      content VARCHAR(500),\
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, \
      post_id INT, \
      author_id INT, \
      FOREIGN KEY (post_id) REFERENCES posts(post_id), \
      FOREIGN KEY (author_id) REFERENCES users(user_id) \
      ); '
    );

    return await Promise.all([qrecs, qusers, qposts, qpostslikers, qcommenters, qposttags, qusertags, qchats, quserchats, qtexts, qinvites, quserinvites, qfriends, qcomments]);
}

// Database connection setup
const db = dbaccess.get_db_connection();

var result = create_tables(dbaccess);
console.log('Tables created');
//db.close_db();

const PORT = config.serverPort;

