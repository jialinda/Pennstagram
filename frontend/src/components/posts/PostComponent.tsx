import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as farHeart } from '@fortawesome/free-regular-svg-icons';
import { faHeart as fasHeart } from '@fortawesome/free-solid-svg-icons';
import './posts.css'; // Make sure your styles are correctly imported
// import config from '/../config.json';
import config from '../../../config.json';
import axios from 'axios';

const PostComponent = ({ postId, username, timestamp, title, content, image_url, comments, likesCount, likedByUser}) => {
  const rootURL = config.serverRootURL;
  const [likes, setLikes] = useState(likesCount);
  const [liked, setLiked] = useState(likedByUser);
  const [commentText, setCommentText] = useState('');
  const [currentComments, setCurrentComments] = useState(comments);


  const toggleLike = async () => {
    try {
      if (!liked) {
        await axios.post(`${rootURL}/likePost`, { liker: username, post_id: postId });
        setLikes(likes + 1);
        setLiked(true);
      } else {
        await axios.post(`${rootURL}/unlikePost`, { liker: username, post_id: postId });
        setLikes(likes - 1);
        setLiked(false);
      }
    } catch (error) {
      console.error('Error handling the like functionality:', error);
    }
  };

  const handleCommentChange = (event) => {
    setCommentText(event.target.value);
  };

  const submitComment = async (event) => {
    event.preventDefault();
    const formattedTimestamp = new Date().toISOString();
    try {
      const response = await axios.post(`${rootURL}/postComment`, {
        author: username,
        content: commentText,
        timestamp: formattedTimestamp,
        post_id: postId
      });
      setCurrentComments([...currentComments, { author: username, content: commentText, timestamp: formattedTimestamp, post_id: postId }]);
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
      <div className='post-title'>{title}</div>
      <div className='post-content'>
        {content}
        {<img src={image_url} style={{ width: '100%', height: 'auto' }} />}
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
};

export default PostComponent;
