import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as farHeart } from '@fortawesome/free-regular-svg-icons';
import { faHeart as fasHeart } from '@fortawesome/free-solid-svg-icons';
import './posts.css'; // Make sure your styles are correctly imported
// import config from '/../config.json';
import config from '../../../config.json';
import axios from 'axios';

const PostComponent = ({ postId, username, timestamp, title, content, comments, likesCount, likedByUser}) => {

  // console.log('username', username);
  // console.log('this is postId', postId);
  // console.log('comments', comments);
  const rootURL = config.serverRootURL;

  const [likes, setLikes] = useState(likesCount);
  const [liked, setLiked] = useState(likedByUser);
  const [commentText, setCommentText] = useState('');
  const [currentComments, setCurrentComments] = useState(comments);

  const toggleLike = async () => {
    try {
      if (!liked) {
        await axios.post(`${rootURL}/likePost`, {
          liker: username,
          post_id: postId
        });
        setLikes(likes + 1);
        setLiked(true);
      } else {
        await axios.post(`${rootURL}/unlikePost`, {
          liker: username,
          post_id: postId
        }); // Ensure you have the correct API endpoint
        setLikes(likes - 1);
        setLiked(false);
      }
    } catch (error) {
      console.error('Error handling the like functionality:', error);
    }
  };

  const handleCommentChange = (event) => {
    setCommentText(event.target.value);
    console.log('this is comment text', commentText);
  };

  const submitComment = async (event) => {
    console.log('commenting frontend');
    event.preventDefault(); // do I need this?
    const timestamp = new Date(); // Get the current timestamp
    const year = timestamp.getFullYear();
    const month = String(timestamp.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed, so add 1
    const day = String(timestamp.getDate()).padStart(2, '0');
    const hours = String(timestamp.getHours()).padStart(2, '0');
    const minutes = String(timestamp.getMinutes()).padStart(2, '0');
    const formattedTimestamp = `${year}-${month}-${day} ${hours}:${minutes}`;

    try {
      console.log('a', rootURL);
      const response = await axios.post(`${rootURL}/postComment`, {
        author: username,
        content: commentText,
        timestamp: formattedTimestamp,
        post_id: postId
      });
      console.log("Image URL:", content);
      const newMessage = {
        // need to add instead of author of the post, author of the commenter
        author: username,
        content: commentText,
        timestamp: formattedTimestamp,
        post_id: postId
      };
      console.log('adding new comment', newMessage);
      setCurrentComments([...currentComments, newMessage]);
      // setCurrentComments([...currentComments, response.data.comment]);
      setCommentText(''); 
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  };

  return (
    <div className='post-container'>
      <div className='post-header'>
        <span className='post-username'>@{username}</span>
        <span className='post-metadata'>posted on {new Date(timestamp).toLocaleString()}</span>
      </div>
      <div className='post-title'>
        {title}
      </div>
      <div className='post-content'>
  {content && <img src={content} alt="Post" style={{ width: '100%', height: 'auto' }} />}
</div>
      <div className="likes-comments">
        <span onClick={toggleLike} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <FontAwesomeIcon icon={liked ? fasHeart : farHeart} color={liked ? 'red' : 'black'} style={{ marginRight: '8px' }} />
          {likes}
        </span>
        <h4>Comments:</h4>
        {currentComments.map((comment, index) => (
          <div key={index} className="comment">
            <strong>{comment.author}</strong> ({new Date(comment.timestamp).toLocaleString()}): {comment.content}
          </div>
        ))}
        <form onSubmit={submitComment}>
          <input
            type="text"
            value={commentText}
            onChange={handleCommentChange}
            placeholder="Add a comment..."
            className="comment-input"
          />
          <button type="submit" className="submit-comment">Post Comment</button>
        </form>
      </div>
    </div>
  );
}

export default PostComponent;
// import React from 'react';

// interface PostProps {
//   username: string;
//   timestamp: string;
//   title: string;
//   content: string;
//   hashtags: string[];
//   comments: {
//     content: string;
//     timestamp: string;
//     author: string;
//   }[];
//   likesCount: number;
// }

// const PostComponent: React.FC<PostProps> = ({ username, timestamp, title, content, hashtags, comments, likesCount }) => {
//   return (
//     <div className='rounded-md bg-slate-50 w-full max-w-[1000px] space-y-2 p-3'>
//       <div className=' text-slate-800'>
//         <span className='font-semibold'> @{username} </span>
//         posted on {new Date(timestamp).toLocaleString()}
//       </div>
//       <div className='text-2xl font-bold'>
//         { title }
//       </div>
//       <p className=''>
//         { content }
//       </p>
//       <div className="likes-comments">
//         <span>Likes: {likesCount}</span>
//         <h4>Comments:</h4>
//         {comments.map((comment, index) => (
//           <div key={index}>
//             <strong>{comment.author}</strong> ({new Date(comment.timestamp).toLocaleString()}): {comment.content}
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }

// export default PostComponent;
