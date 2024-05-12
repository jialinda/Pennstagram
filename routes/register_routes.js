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

function register_routes(app) {
    app.get('/hello', routes.get_helloworld);
    app.post('/login', routes.post_login);
    app.post('/logout', routes.post_logout);
    app.post('/register', upload.single('photo'), routes.post_register); 
    app.post('/:username/selections', routes.post_selections); 
    app.get('/hashtags/top', routes.get_top_hashtags);
    app.get('/:username/friends', routes.get_friends);
    app.get('/:username/recommendations', routes.get_friend_recs);
    app.post('/:username/createPost', upload.single('content'), routes.create_post); 
    app.get('/:username/feed', routes.get_feed);
    // TODO: register getMovie, which does not need a :username
    //       Make it compatible with the call from ChatInterface.tsx
    app.get('/:username/movies', routes.get_movie); 
    // CHECK because u have to update it
    app.get('/chat/:chatId', routes.get_chat_by_id); // check
    app.get('/:username/userinfo', routes.get_user_info); 
    app.post('/:username/changeActor', routes.change_actor); 
    app.post('/:username/changeEmail', routes.change_email); 
    app.post('/:username/changePassword', routes.change_password);    
    app.post('/:username/changeHashtags', routes.change_hashtags); 
    app.post('/search', llmroutes.get_NaturalSearch);    

    app.get('/getChatAll', routes.get_chat_all); // check
    app.post('/postChat', routes.post_chat); 
    app.post('/postText', routes.post_text); 
    app.get('/getInviteAll', routes.get_invite_all); // check
    app.post('/postInvite', routes.post_invite); 
    app.post('/postInviteChat', routes.post_invite_chat); 
    app.post('/confirmInvite', routes.confirm_invite); 
    app.post('/confirmInviteChat', routes.confirm_inivte_chat);
    // FRIEND-RELATED ROUTES
    app.get('/getFriend', routes.get_friend_by_username);
    app.post('/addFriends', routes.add_friends); // by id // POST
    app.post('/postFInvite', routes.post_f_invite);
    app.post('/deleteUFInvite', routes.delete_u_f_invite);
    app.post('/deleteFInvite', routes.delete_f_invite);
    app.get('/getFInviteAll', routes.get_f_invite_all);
    app.post('/confirmFInvite', routes.confirm_f_invite);
    app.post('/removeFriend', routes.remove_friend);
    app.post('/deleteUInvite', routes.delete_u_invite);
    app.post('/deleteInvite', routes.delete_invite); // check if it;s ok to do post
    app.post('/leaveChatroom', routes.leave_chatroom); // by id // POST
    app.get('/getTextByChatId', routes.get_text_by_chat_id);
    app.get('/getUserByUsername', routes.get_user_by_username);
    
    app.post('/postOnline', routes.post_online);
    app.post('/likePost', routes.like_post);
    app.post('/unlikePost', routes.unlike_post);
    app.post('/postComment', routes.post_comment);
    // GROUP-related posts
    app.post('/postGroup', routes.post_group);
    app.get('/:username/getGroupsAll', routes.get_groups_all);
    app.get('/getGroupByName', routes.get_group_by_name);
    app.post('/joinGroup', routes.join_group);
    app.post('/leaveGroup', routes.leave_group);
// ); 
  }
  