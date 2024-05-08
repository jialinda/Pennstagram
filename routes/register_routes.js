const routes = require('./routes.js');
const multer = require('multer');
const llmroutes = require('./llm_routes.js');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
      // You might want to set the file name to something unique like below:
      cb(null, Date.now() + '-' + file.originalname)
    }
  });
  
  const upload = multer({ storage: storage });
  


module.exports = {
    register_routes
}


// Initialize multer upload middleware with the storage configuration
// const upload = multer({ storage: storage });

function register_routes(app) {
    app.get('/hello', routes.get_helloworld);
    app.post('/login', routes.post_login);
    app.post('/logout', routes.post_logout);
    app.post('/register', upload.single('photo'), routes.post_register); 
    app.post('/:username/selections', routes.post_selections); 
    app.get('/hashtags/top', routes.get_top_hashtags);
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
    app.get('/:username/userinfo', routes.get_user_info); 
    app.post('/:username/changeActor', routes.change_actor); 
    app.post('/:username/changeEmail', routes.change_email); 
    app.post('/:username/changePassword', routes.change_password);    
    app.post('/:username/changeHashtags', routes.change_hashtags); 
    app.post('/search', llmroutes.get_NaturalSearch);    

// ); 
  }
  