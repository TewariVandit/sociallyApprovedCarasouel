import React, { useRef, useState } from 'react';
import './OuterCarousel.css';
import InnerCarouselModal from './InnerCarouselModal';
import useFetchVideos from '../hooks/useFetchVideos'; // 👈 import hook
import { FaArrowLeft } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa";

export default function OuterCarousel() {
  const scrollRef = useRef();
  const [selectedIndex, setSelectedIndex] = useState(null);

  const { videos, loading, error } = useFetchVideos(); // 👈 use hook

  const scroll = (dir) => {
    const container = scrollRef.current;
    const videoCard = container.querySelector('.video-wrapper');

    if (videoCard && container) {
      const cardWidth = videoCard.offsetWidth + 20; // 20px = CSS gap

      // Determine number of cards visible based on screen width
      let visibleCards = 5; // default

      const screenWidth = window.innerWidth;
      if (screenWidth < 576) {
        visibleCards = 2;
      } else if (screenWidth < 768) {
        visibleCards = 3;
      } else if (screenWidth < 1000) {
        visibleCards = 4;
      }

      const scrollAmount = cardWidth * visibleCards;

      container.scrollBy({
        left: dir === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    }
  };


  if (loading) return <p>Loading videos...</p>;
  if (error) return <p>Error loading videos.</p>;

  return (
    <>
      <div className="carousel-wrapper">
        <p>Socially Approved
        </p>
        <div className="carousel-header">
          <button className="scroll-btn" onClick={() => scroll('left')}><FaArrowLeft /></button>
          <button className="scroll-btn" onClick={() => scroll('right')}><FaArrowRight /></button>
        </div>
        <div className="carousel-container" ref={scrollRef}>
          {videos.map((video, idx) => (
            <div key={video._id || idx} className="video-wrapper" onClick={() => setSelectedIndex(idx)}>
              <video
                src={video.videoUrl}
                poster={video.thumbnailUrl}
                muted
                autoPlay
                loop
                playsInline
                className="carousel-video"
              />
            </div>
          ))}
        </div>
      </div>

      {selectedIndex !== null && (
        <InnerCarouselModal
          videos={videos}
          startIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  );
}
