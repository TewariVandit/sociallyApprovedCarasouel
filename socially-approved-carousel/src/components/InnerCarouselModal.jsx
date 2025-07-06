import React, { useEffect, useRef, useState } from 'react';
import './InnerCarouselModal.css';
import { FaHeart, FaRegHeart, FaWhatsapp, FaInstagram, FaLink, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { CiShare2 } from 'react-icons/ci';

export default function InnerCarouselModal({ videos, startIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const videoRefs = useRef([]);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [localVideos, setLocalVideos] = useState([...videos]);
  const [shareCount, setShareCount] = useState(videos[startIndex]?.shares.length || 0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const isMobile = window.innerWidth <= 600;

  const currentVideo = localVideos[currentIndex];
  const currentVideoId = currentVideo?._id || currentVideo?.id;
  const likedVideos = JSON.parse(localStorage.getItem('likedVideos')) || [];
  const liked = likedVideos.includes(currentVideoId);
  const likeCount = currentVideo?.likes || 0;

  useEffect(() => {
    if (!isMobile) {
      setShareCount(currentVideo?.shares?.length || 0);
    }
  }, [currentIndex, localVideos]);

  useEffect(() => {
    if (!isMobile) {
      playOnlyCurrent();
    }
  }, [currentIndex, playing, muted]);

  const playOnlyCurrent = () => {
    videoRefs.current.forEach((vid, i) => {
      if (vid) {
        if (i === currentIndex) {
          playing ? vid.play() : vid.pause();
          vid.muted = muted;
        } else {
          vid.pause();
        }
      }
    });
  };

  const handleShare = () => setShowShareModal(true);

  const incrementShare = async (platform) => {
    const updatedVideos = [...localVideos];
    updatedVideos[currentIndex] = {
      ...updatedVideos[currentIndex],
      shares: [...(updatedVideos[currentIndex].shares || []), { platform, sharedAt: Date.now() }],
    };
    setLocalVideos(updatedVideos);
    setShareCount(updatedVideos[currentIndex].shares.length);
    localStorage.setItem('videoData', JSON.stringify(updatedVideos));

    try {
      await fetch(`/api/videos/${currentVideoId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: currentVideoId, platform }),
      });
    } catch (err) {
      console.error('Failed to record share on server:', err);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(currentVideo.videoUrl);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const toggleLike = async () => {
    const isLiked = likedVideos.includes(currentVideoId);
    let updatedLikedVideos;
    let updatedCount = likeCount;

    if (isLiked) {
      updatedLikedVideos = likedVideos.filter(id => id !== currentVideoId);
      updatedCount -= 1;
    } else {
      updatedLikedVideos = [...likedVideos, currentVideoId];
      updatedCount += 1;
    }

    localStorage.setItem('likedVideos', JSON.stringify(updatedLikedVideos));

    const updatedVideos = [...localVideos];
    updatedVideos[currentIndex] = {
      ...updatedVideos[currentIndex],
      likes: updatedCount,
    };
    setLocalVideos(updatedVideos);
    localStorage.setItem('videoData', JSON.stringify(updatedVideos));

    try {
      await fetch(`/api/videos/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: currentVideoId, liked: !isLiked }),
      });
    } catch (err) {
      console.error('Failed to update like on server:', err);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRefs.current[currentIndex];
    if (video && video.duration) {
      const percentage = (video.currentTime / video.duration) * 100;
      setProgress(percentage);
    }
  };

  const toggleMute = () => {
    const video = videoRefs.current[currentIndex];
    if (video) {
      video.muted = !muted;
      setMuted(!muted);
    }
  };

  const togglePlay = () => {
    setPlaying(!playing);
    const video = videoRefs.current[currentIndex];
    if (video) {
      playing ? video.pause() : video.play();
    }
  };

  const nextVideo = () => {
    if (currentIndex < videos.length - 1) {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setProgress(0);
        setTransitioning(false);
      }, 300);
    }
  };

  const prevVideo = () => {
    if (currentIndex > 0) {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
        setProgress(0);
        setTransitioning(false);
      }, 300);
    }
  };

  useEffect(() => {
    if (!isMobile) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play();
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.8 }
    );

    videoRefs.current.forEach(video => {
      if (video) observer.observe(video);
    });

    return () => {
      videoRefs.current.forEach(video => {
        if (video) observer.unobserve(video);
      });
    };
  }, [isMobile]);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>×</button>

        {!isMobile && (
          <>
            <button className="nav-left" onClick={prevVideo} disabled={currentIndex === 0}><FaArrowLeft /></button>
            <button className="nav-right" onClick={nextVideo} disabled={currentIndex === videos.length - 1}><FaArrowRight /></button>

            <div className="video-layout">
              {currentIndex > 0 && (
                <div className="side-video left">
                  <video
                    src={videos[currentIndex - 1].videoUrl}
                    muted
                    loop
                    playsInline
                    ref={el => videoRefs.current[currentIndex - 1] = el}
                    className="preview-video"
                  />
                </div>
              )}

              <div className="center-video-container">
                <video
                  src={videos[currentIndex].videoUrl}
                  muted={muted}
                  autoPlay
                  loop
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  ref={el => videoRefs.current[currentIndex] = el}
                  className={`center-video ${transitioning ? 'fade-out' : 'fade-in'}`}
                  poster={videos[currentIndex].thumbnailUrl}
                />

                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="top-left">
                  <button onClick={togglePlay}>{playing ? '⏸' : '▶️'}</button>
                </div>

                <div className="top-right">
                  <button onClick={toggleMute}>{muted ? '🔇' : '🔊'}</button>
                </div>

                <div className="right-side-icons">
                  <span>
                    <button className="icon-btn" onClick={toggleLike}>
                      {liked ? <FaHeart color="red" size={24} /> : <FaRegHeart color="white" size={24} />}
                    </button>
                    <p className="icon-count">{likeCount}</p>
                  </span>
                  <span>
                    <button className="icon-btn" onClick={handleShare}><CiShare2 /></button>
                    <p className="icon-count">{shareCount}</p>
                  </span>
                </div>
              </div>

              {currentIndex < videos.length - 1 && (
                <div className="side-video right">
                  <video
                    src={videos[currentIndex + 1].videoUrl}
                    muted
                    loop
                    playsInline
                    ref={el => videoRefs.current[currentIndex + 1] = el}
                    className="preview-video"
                  />
                </div>
              )}
            </div>
          </>
        )}

        {isMobile && (
          <div className="mobile-reel-wrapper">
            <button className="close-btn" onClick={onClose}>×</button>
            {videos.map((video, index) => {
              const videoId = video._id || video.id;
              const liked = likedVideos.includes(videoId);
              const likeCount = video.likes || 0;

              return (
                <div className="reel-container" key={index}>
                  <video
                    src={video.videoUrl}
                    ref={el => videoRefs.current[index] = el}
                    className="reel-video"
                    muted
                    loop
                    autoPlay
                    playsInline
                    poster={video.thumbnailUrl}
                  />
                  <div className="top-left">
                    <button onClick={togglePlay}>{playing ? '⏸' : '▶️'}</button>
                  </div>
                  <div className="reel-progress">
                    <div className="fill" style={{ width: `${progress}%` }}></div>
                  </div>

                  <div className="top-right">
                    <button onClick={toggleMute}>{muted ? '🔇' : '🔊'}</button>
                  </div>

                  <div className="right-side-icons">
                    <span>
                      <button className="icon-btn" onClick={toggleLike}>
                        {liked ? <FaHeart color="red" size={24} /> : <FaRegHeart color="white" size={24} />}
                      </button>
                      <p className="icon-count">{likeCount}</p>
                    </span>
                    <span>
                      <button className="icon-btn" onClick={handleShare}><CiShare2 /></button>
                      <p className="icon-count">{shareCount}</p>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showToast && (
          <div className="toast-notification">Link copied to clipboard!</div>
        )}

        {showShareModal && (
          <div className="share-modal">
            <div className="share-header">
              <p>Share</p>
              <button className='share-close' onClick={() => setShowShareModal(false)}>×</button>
            </div>
            <div className="share-options">
              <button className="share-icon" onClick={() => {
                incrementShare('whatsapp');
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(currentVideo.videoUrl)}`, '_blank');
              }}><FaWhatsapp size={28} color="#25D366" /></button>

              <button className="share-icon" onClick={() => {
                incrementShare('instagram');
                window.open('https://www.instagram.com', '_blank');
              }}><FaInstagram size={28} color="#E1306C" /></button>

              <button className="share-icon" onClick={() => {
                incrementShare('copy');
                copyLink();
              }}><FaLink size={28} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
