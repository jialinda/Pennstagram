import React from 'react';

interface PostProps {
  username: string;
  timestamp: string;
  title: string;
  content: string;
  hashtags: string[];
  comments: {
    content: string;
    timestamp: string;
    author: string;
  }[];
  likesCount: number;
}

const PostComponent: React.FC<PostProps> = ({ username, timestamp, title, content, hashtags, comments, likesCount }) => {
  return (
    <div className='rounded-md bg-slate-50 w-full max-w-[1000px] space-y-2 p-3'>
      <div className=' text-slate-800'>
        <span className='font-semibold'> @{username} </span>
        posted on {new Date(timestamp).toLocaleString()}
      </div>
      <div className='text-2xl font-bold'>
        { title }
      </div>
      <p className=''>
        { content }
      </p>
      <div className="likes-comments">
        <span>Likes: {likesCount}</span>
        <h4>Comments:</h4>
        {comments.map((comment, index) => (
          <div key={index}>
            <strong>{comment.author}</strong> ({new Date(comment.timestamp).toLocaleString()}): {comment.content}
          </div>
        ))}
      </div>
    </div>
  )
}

export default PostComponent;
