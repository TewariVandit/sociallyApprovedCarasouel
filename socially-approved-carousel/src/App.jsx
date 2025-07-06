import React from 'react';
import useFetchVideos from './hooks/useFetchVideos';
import OuterCarousel from './components/OuterCarousel';

const App = () => {
  const { videos, loading, error } = useFetchVideos();

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error loading videos</p>}
      {!loading && videos.length > 0 && (
        <OuterCarousel />
      )}
      {console.log(videos)}
    </div>
  );
};

export default App;
