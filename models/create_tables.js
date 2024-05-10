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
      email VARCHAR(255), \
      affiliation VARCHAR(255), \
      password VARCHAR(255), \
      birthday date, \
      imageUrl VARCHAR(500),\
      linkedActor VARCHAR(500), \
      actorsList VARCHAR(700) \
    );')

    var qrecs = db.create_tables('CREATE TABLE IF NOT EXISTS recommendations ( \
      person INT, \
      recommendation INT, \
      strength int, \
      FOREIGN KEY (person) REFERENCES users(user_id), \
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

    // make table for post images + associated post id 
    var qpostmedia = db.create_tables('CREATE TABLE IF NOT EXISTS post_media ( \
      media_id INT AUTO_INCREMENT PRIMARY KEY, \
      post_id INT, \
      media_url VARCHAR(500), \
      FOREIGN KEY (post_id) REFERENCES posts(post_id));'
    );

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


    var qusertags = db.create_tables('CREATE TABLE IF NOT EXISTS hashtags ( \
      hashtag_id INT AUTO_INCREMENT PRIMARY KEY,\
      hashtagname VARCHAR(255) \
    );')

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

    /**** chat-related table ***/
    // ADDED CHECK
    // this one has circular dependency might have to delete it
    // var qchats = db.create_tables('CREATE TABLE IF NOT EXISTS chats ( \
    //   chat_id INT AUTO_INCREMENT PRIMARY KEY, \
    //   chatname VARCHAR(255), \
    //   latest_text_id INT,\
    //   admin_id INT, \
    //   FOREIGN KEY (latest_text_id) REFERENCES texts(text_id), \
    //   FOREIGN KEY (admin_id) REFERENCES chats(user_id) \
    // );')
    var qchats = db.create_tables('CREATE TABLE IF NOT EXISTS chats ( \
      chat_id INT AUTO_INCREMENT PRIMARY KEY, \
      chatname VARCHAR(255), \
      admin_id INT, \
      FOREIGN KEY (admin_id) REFERENCES users(user_id) \
    );')

    var qtexts = db.create_tables('CREATE TABLE IF NOT EXISTS texts ( \
      text_id INT AUTO_INCREMENT PRIMARY KEY, \
      author_id INT, \
      chat_id INT, \
      content VARCHAR(500), \
      timestamp VARCHAR(500), \
      FOREIGN KEY (author_id) REFERENCES users(user_id), \
      FOREIGN KEY (chat_id) REFERENCES chats(chat_id) \
    );')

    // establishing the chat users in there
    var quserchats = db.create_tables('CREATE TABLE IF NOT EXISTS user_chats ( \
      user_id INT, \
      chat_id INT, \
      is_active INT,\
      FOREIGN KEY (user_id) REFERENCES users(user_id), \
      FOREIGN KEY (chat_id) REFERENCES chats(chat_id) \
    );')

    var qinvites = db.create_tables('CREATE TABLE IF NOT EXISTS invites ( \
      invite_id INT AUTO_INCREMENT PRIMARY KEY, \
      chat_id INT, \
      invitee_id INT, \
      inviter_id INT, \
      confirmed BOOLEAN, \
      is_groupchat BOOLEAN, \
      FOREIGN KEY (invitee_id) REFERENCES users(user_id), \
      FOREIGN KEY (inviter_id) REFERENCES users(user_id), \
      FOREIGN KEY (chat_id) REFERENCES chats(chat_id) \
    );')

    var quserinvites = db.create_tables('CREATE TABLE IF NOT EXISTS user_invites ( \
      user_id INT, \
      invite_id INT, \
      FOREIGN KEY (user_id) REFERENCES users(user_id), \
      FOREIGN KEY (invite_id) REFERENCES invites(invite_id) \
    );')

    var qfinvites = db.create_tables('CREATE TABLE IF NOT EXISTS friend_invites ( \
      f_invite_id INT AUTO_INCREMENT PRIMARY KEY, \
      sender_id INT, \
      receiver_id INT, \
      confirmed BOOLEAN, \
      FOREIGN KEY (sender_id) REFERENCES users(user_id), \
      FOREIGN KEY (receiver_id) REFERENCES users(user_id) \
    );')

    var quserfinvites = db.create_tables('CREATE TABLE IF NOT EXISTS user_f_invites ( \
      user_id INT, \
      f_invite_id INT, \
      FOREIGN KEY (user_id) REFERENCES users(user_id), \
      FOREIGN KEY (f_invite_id) REFERENCES friend_invites(f_invite_id) \
    );')

    var qfriends = db.create_tables('CREATE TABLE IF NOT EXISTS friends ( \
      followed INT, \
      follower INT, \
      FOREIGN KEY (follower) REFERENCES users(user_id), \
      FOREIGN KEY (followed) REFERENCES users(user_id) \
      );')

      var qlogin = db.create_tables('CREATE TABLE IF NOT EXISTS login ( \
        user_id INT, \
        is_online INT, \
        FOREIGN KEY (user_id) REFERENCES users(user_id)\
        );')

    // var qgroups = db.create_tables('CREATE TABLE IF NOT EXISTS communities ( \
    //   communities_id INT AUTO_INCREMENT PRIMARY KEY, \
    //   communities_name VARCHAR(500),\
    //   chat_id INT,\
    //   admin_id INT,\
    //   FOREIGN KEY (chat_id) REFERENCES chats(chat_id),\
    //   FOREIGN KEY (admin_id) REFERENCES users(user_id)\
    // );')
  
    // var qusergroups = db.create_tables('CREATE TABLE IF NOT EXISTS user_communities ( \
    //   user_id INT, \
    //   communities_id INT, \
    //   FOREIGN KEY (user_id) REFERENCES users(user_id),\
    //   FOREIGN KEY (communities_id) REFERENCES communities(communities_id)\
    // );')

    return await Promise.all([qrecs, qusers, qposts, qpostslikers, qcommenters, qposttags, qusertags, qchats, quserchats, qtexts, qinvites, quserinvites, qfriends, qcomments, qfinvites, quserfinvites, qlogin]);
      // qgroups, qusergroups]);
}

// Database connection setup
const db = dbaccess.get_db_connection();

var result = create_tables(dbaccess);
console.log('Tables created');
//db.close_db();

const PORT = config.serverPort;

