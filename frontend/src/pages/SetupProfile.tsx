import { useState, useEffect, SetStateAction } from 'react';
import axios from 'axios';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import config from '../../config.json';  

function SetupProfile() {
    const navigate = useNavigate();
    const { username } = useParams();
    const [actors, setActors] = useState([]);
    const [selectedActor, setSelectedActor] = useState(null);
    const [hashtags, setHashtags] = useState([]);
    const [selectedHashtags, setSelectedHashtags] = useState([]);
    const location = useLocation();

    useEffect(() => {
        // Set actors from location state if available
        if (location.state?.actors) {
            setActors(location.state.actors);
        } else {
            console.error('No actors provided, check registration process');
        }

        // Fetch top hashtags from the server
        const fetchHashtags = async () => {
            try {
                const response = await axios.get(`${config.serverRootURL}/hashtags/top`);
                if (response.data) {
                    setHashtags(response.data.map((item: { hashtagname: any; }) => item.hashtagname));
                }
            } catch (error) {
                console.error('Failed to fetch hashtags:', error);
            }
        };

        fetchHashtags();
    }, [location.state]);

    const handleActorSelect = (actor: SetStateAction<null>) => {
        setSelectedActor(actor);
    };

    const handleHashtagToggle = (hashtag: never) => {
        if (selectedHashtags.includes(hashtag)) {
            setSelectedHashtags(prev => prev.filter(h => h !== hashtag));
        } else {
            setSelectedHashtags(prev => [...prev, hashtag]);
        }
    };

    const handleSubmit = async () => {
        try {
            await axios.post(`${config.serverRootURL}/${username}/selections`, {
                actor: selectedActor,
                hashtags: selectedHashtags
            });
            navigate(`/${username}/home`);
        } catch (error) {
            console.error('Failed to submit selections:', error);
        }
    };

    return (
        <div>
            <h1>Select your favorite Actor and Hashtags</h1>
            <div>
                {actors.map((actor, index) => (
                    <button key={actor} onClick={() => handleActorSelect(actor)}
                        className={selectedActor === actor ? 'selected' : ''}>
                        {actor} 
                    </button>
                ))}
            </div>
            <div>
                {hashtags.map((hashtag, index) => (
                    <button key={index} onClick={() => handleHashtagToggle(hashtag)}
                        className={selectedHashtags.includes(hashtag) ? 'selected' : ''}>
                        {hashtag}
                    </button>
                ))}
            </div>
            <button onClick={handleSubmit}>Submit Selections</button>
        </div>
    );
}

export default SetupProfile;
