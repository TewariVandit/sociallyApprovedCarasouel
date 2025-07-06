import { useEffect, useState } from 'react';
import axios from 'axios';

const useFetchVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cachedVideos = localStorage.getItem('videoData');

    if (cachedVideos) {
      setVideos(JSON.parse(cachedVideos));
      setLoading(false);
      console.log('Loaded videos from localStorage');
    } else {
      const fetchVideos = async () => {
        try {
          // ✅ Use relative path — this works on both dev & Render
          const res = await axios.get('/api/videos');
          setVideos(res.data);
          localStorage.setItem('videoData', JSON.stringify(res.data));
          console.log('Fetched and cached videos:', res.data);
        } catch (err) {
          console.error('Error fetching videos:', err);
          setError(err);
        } finally {
          setLoading(false);
        }
      };

      fetchVideos();
    }
  }, []);

  return { videos, loading, error };
};

export default useFetchVideos;
