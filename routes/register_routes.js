const routes = require('./routes.js');

module.exports = {
    register_routes
}


// Initialize multer upload middleware with the storage configuration
// const upload = multer({ storage: storage });

function register_routes(app) {
    app.get('/hello', routes.get_helloworld);
    app.post('/login', routes.post_login);
    app.post('/signup', routes.post_register); 
    app.post('/uploadPhoto', routes.upload_photo);
    // app.post('/register', routes.post_register); 
    app.get('/:username/friends', routes.get_friends);
    app.get('/:username/recommendations', routes.get_friend_recs);
    app.post('/:username/createPost', routes.create_post); 
    app.get('/:username/feed', routes.get_feed);
    // TODO: register getMovie, which does not need a :username
    //       Make it compatible with the call from ChatInterface.tsx
    app.get('/:username/movies', routes.get_movie); 
    // CHECK because u have to update it
    app.get('/chat/:chatId', routes.get_chat_by_id); // check
    app.get('/chat', routes.get_chat_all); // check
    app.get('/:username/movies', routes.post_chat); 
    app.get('/:username/movies', routes.post_text); 
    app.get('/:username/movies', routes.post_invite); 
    app.get('/:username/movies', routes.confirm_invite); 
    // app.get('/:username/movies', routes.get_friend_by_username: getFriendName
// ); 
  }
  