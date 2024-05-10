import { useState } from 'react';
import axios from 'axios';
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';

const Search = () => {
  const rootURL = config.serverRootURL;
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState('');

  // Function to handle search
  const handleSearch = async () => {
    try {
      const response = await axios.post(`${rootURL}/search`, { question: query });
      setResults(JSON.stringify(response.data, null, 2)); // Format JSON data nicely
      console.log('search result:', response.data);
    } catch (error) {
      console.error("Error performing search:", error);
    }
  };

  return (
    <div className='w-screen h-screen flex flex-col bg-gray-50'>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-blue-500 text-black">
        <button onClick={() => navigate("/profile")} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 focus:outline-none focus:bg-blue-600">My Profile</button>
        <input 
          type="text" 
          value={query} 
          onChange={e => setQuery(e.target.value)} 
          placeholder="Search here..." 
          className="p-2 rounded-lg w-1/2"
        />
        <button onClick={handleSearch} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 focus:outline-none focus:bg-blue-600">Search</button>
      </div>
      
      {/* Search Results */}
      <div className='flex-1 flex flex-col items-center justify-around p-6'>
        <div className='text-center mt-6'>
          <h3 className='text-3xl font-bold mb-4 text-blue-400'>Search Results</h3>
          <textarea 
            value={results} 
            readOnly
            className="w-full h-96 p-2 text-sm font-mono border rounded-lg overflow-auto"
            style={{ whiteSpace: 'pre-wrap' }} // Keeps whitespace formatting from JSON.stringify
          />
        </div>
      </div>
    </div>
  );
};

export default Search;
