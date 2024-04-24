const routes = require('./routes.js');
const multer = require('multer'); // For handling file uploads
const path = require('path');

module.exports = {
    register_routes
}

// Set up multer storage configuration for handling file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/'); // Save uploaded files to the 'uploads' directory
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // Add timestamp to avoid filename conflicts
    }
});

// Initialize multer upload middleware with the storage configuration
const upload = multer({ storage: storage });

function register_routes(app) {
    app.get('/hello', routes.get_helloworld);
    app.post('/login', routes.post_login);
    app.post('/signup', routes.post_register); 
    // app.post('/register', routes.post_register); 
    app.get('/:username/friends', routes.get_friends);
    app.get('/:username/recommendations', routes.get_friend_recs);
    app.post('/:username/createPost', routes.create_post); 
    app.get('/:username/feed', routes.get_feed);
    // TODO: register getMovie, which does not need a :username
    //       Make it compatible with the call from ChatInterface.tsx
    app.get('/:username/movies', routes.get_movie); 
    app.post('/uploadPhoto', upload.single('photo'), routes.upload_photo);
  }
  