const routes = require('./routes.js');
const multer = require('multer');
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
    app.post('/register', upload.single('photo'), routes.post_register); 
    app.post('/uploadPhoto', routes.upload_photo);
    // app.post('/register', routes.post_register); 
    app.get('/:username/friends', routes.get_friends);
    app.get('/:username/recommendations', routes.get_friend_recs);
    app.post('/:username/createPost', routes.create_post); 
    app.get('/:username/feed', routes.get_feed);
    // TODO: register getMovie, which does not need a :username
    //       Make it compatible with the call from ChatInterface.tsx
    app.get('/:username/movies', routes.get_movie); 
  }
  