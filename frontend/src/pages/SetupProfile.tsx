import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import config from '../../config.json';  

function SetupProfile() {
    const navigate = useNavigate();
    const { username } = useParams();
    const [actors, setActors] = useState([]);
    const [selectedActor, setSelectedActor] = useState('');
    const [hashtags, setHashtags] = useState([]);
    const [selectedHashtags, setSelectedHashtags] = useState([]);
    const location = useLocation();

    useEffect(() => {
        if (location.state?.actorNames) {
            setActors(location.state.actorNames);
        } else {
            console.error('No actors provided, check registration process');
        }

        const fetchHashtags = async () => {
            try {
                const response = await axios.get(`${config.serverRootURL}/hashtags/top`);
                if (response.data) {
                    setHashtags(response.data.map((item) => item.hashtagname));
                }
            } catch (error) {
                console.error('Failed to fetch hashtags:', error);
            }
        };

        fetchHashtags();
    }, [location.state]);

    const handleActorSelect = (actor) => {
        setSelectedActor(actor);
    };

    const handleHashtagToggle = (hashtag) => {
        if (selectedHashtags.includes(hashtag)) {
            setSelectedHashtags(prev => prev.filter(h => h !== hashtag));
        } else {
            setSelectedHashtags(prev => [...prev, hashtag]);
        }
    };

    const handleSubmit = async () => {
        try {
          console.log('selectedActor:', selectedActor);
          console.log('selectedHashtags:', hashtags);
            await axios.post(`${config.serverRootURL}/${username}/selections`, {
                actor: selectedActor,
                hashtags: selectedHashtags
            });
            navigate(`/${username}/feed`); // brings you to feed?
        } catch (error) {
            console.error('Failed to submit selections:', error);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-5 bg-white rounded-lg shadow">
            <h1 className="text-xl font-semibold text-center text-gray-800 mb-4">Select your favorite Actor and Hashtags</h1>
            <div className="mb-4">
                {actors.map((actor, index) => (
                    <label key={index} className="inline-flex items-center mt-3">
                        <input
                            type="radio"
                            className="form-radio h-5 w-5 text-blue-600"
                            name="actor"
                            checked={selectedActor === actor}
                            onChange={() => handleActorSelect(actor)}
                        />
                        <span className="ml-2 text-gray-700">{actor}</span>
                    </label>
                ))}
            </div>
            <div className="mb-6">
                {hashtags.map((hashtag, index) => (
                    <label key={index} className="inline-flex items-center mt-3">
                        <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-blue-600"
                            checked={selectedHashtags.includes(hashtag)}
                            onChange={() => handleHashtagToggle(hashtag)}
                        />
                        <span className="ml-2 text-gray-700">{hashtag}</span>
                    </label>
                ))}
            </div>
            <button
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                onClick={handleSubmit}
            >
                Submit Selections
            </button>
        </div>
    );
}

export default SetupProfile;
