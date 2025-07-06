import React, { useEffect, useRef, useState } from 'react';
import './InnerCarouselModal.css';
import {
  FaHeart,
  FaRegHeart,
  FaWhatsapp,
  FaInstagram,
  FaLink,
  FaArrowLeft,
  FaArrowRight
} from 'react-icons/fa';
import { CiShare2 } from 'react-icons/ci';

/**
 * API base resolves automatically:
 *  - in development `VITE_API_BASE_URL` can be `http://localhost:5000`
 *  - in production keep it empty string (same origin)
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function InnerCarouselModal({ videos: propVideos, startIndex = 0, onClose }) {
  /** ------------------------------------------------------------------
   * LOCAL STATE & REFS
   * -----------------------------------------------------------------*/
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [localVideos, setLocalVideos] = useState(() => [...propVideos]);

  const videoRefs = useRef([]); // filled dynamically below
  videoRefs.current = Array(localVideos.length);

  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;

  const currentVideo = localVideos[currentIndex] || {};
  const currentVideoId = currentVideo._id || currentVideo.id;

  /** Likes -----------------------------------------------------------*/
  const [likedVideos, setLikedVideos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('likedVideos')) || [];
    } catch (err) {
      return [];
    }
  });
  const liked = likedVideos.includes(currentVideoId);
  const [likeCount, setLikeCount] = useState(currentVideo.likes || 0);

  /** Shares ----------------------------------------------------------*/
  const [shareCount, setShareCount] = useState(currentVideo.shares?.length || 0);

  /** ------------------------------------------------------------------
   * HELPERS
   * -----------------------------------------------------------------*/
  const playOnlyCurrent = () => {
    videoRefs.current.forEach((vid, i) => {
      if (!vid) return;
      if (i === currentIndex) {
        playing ? vid.play().catch(() => {}) : vid.pause();
        vid.muted = muted;
      } else {
        vid.pause();
      }
    });
  };

  /** ------------------------------------------------------------------
   * SIDE‑EFFECTS
   * -----------------------------------------------------------------*/
  // keep like/share count in sync when currentIndex changes
  useEffect(() => {
    setLikeCount(currentVideo.likes || 0);
    setShareCount(currentVideo.shares?.length || 0);
  }, [currentIndex, localVideos]);

  // auto‑play only current (desktop)
  useEffect(() => {
    if (!isMobile) playOnlyCurrent();
  }, [currentIndex, playing, muted, isMobile]);

  // intersection observer for mobile reels
  useEffect(() => {
    if (!isMobile) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.8 }
    );
    videoRefs.current.forEach(v => v && observer.observe(v));
    return () => videoRefs.current.forEach(v => v && observer.unobserve(v));
  }, [isMobile]);

  /** ------------------------------------------------------------------
   * API ACTIONS
   * -----------------------------------------------------------------*/
  const post = async (url, body) => {
    try {
      await fetch(`${API_BASE}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } catch (err) {
      console.error(`POST ${url} failed:`, err);
    }
  };

  const incrementShare = async platform => {
    setLocalVideos(vs => {
      const updated = [...vs];
      updated[currentIndex] = {
        ...updated[currentIndex],
        shares: [...(updated[currentIndex].shares || []), { platform, sharedAt: Date.now() }]
      };
      localStorage.setItem('videoData', JSON.stringify(updated));
      return updated;
    });
    setShareCount(c => c + 1);
    post(`/api/videos/${currentVideoId}/share`, { videoId: currentVideoId, platform });
  };

  const toggleLike = (idx = currentIndex) => {
    const vid = localVideos[idx];
    if (!vid) return;
    const videoId = vid._id || vid.id;

    setLikedVideos(prev => {
      const isLiked = prev.includes(videoId);
      const updatedLiked = isLiked ? prev.filter(id => id !== videoId) : [...prev, videoId];
      localStorage.setItem('likedVideos', JSON.stringify(updatedLiked));
      return updatedLiked;
    });

    setLocalVideos(vs => {
      const updated = [...vs];
      const isLiked = likedVideos.includes(videoId);
      updated[idx] = { ...updated[idx], likes: (updated[idx].likes || 0) + (isLiked ? -1 : 1) };
      localStorage.setItem('videoData', JSON.stringify(updated));
      return updated;
    });

    post(`/api/videos/like`, { videoId, liked: !likedVideos.includes(videoId) });
  };

  /** ------------------------------------------------------------------
   * VIDEO HANDLERS
   * -----------------------------------------------------------------*/
  const handleTimeUpdate = () => {
    const v = videoRefs.current[currentIndex];
    if (v?.duration) setProgress((v.currentTime / v.duration) * 100);
  };

  const toggleMute = () => setMuted(m => !m);
  const togglePlay = () => setPlaying(p => !p);

  const nextVideo = () => {
    if (currentIndex < localVideos.length - 1) {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(i => i + 1);
        setProgress(0);
        setTransitioning(false);
      }, 300);
    }
  };

  const prevVideo = () => {
    if (currentIndex > 0) {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(i => i - 1);
        setProgress(0);
        setTransitioning(false);
      }, 300);
    }
  };

  /** ------------------------------------------------------------------
   * RENDER HELPERS
   * -----------------------------------------------------------------*/
  const renderSideVideo = (video, refCb, extraClass = "") => (
    <div className={`side-video ${extraClass}`}>
      <video
        src={video.videoUrl.replace('http://', 'https://')}
        muted
        loop
        playsInline
        ref={refCb}
        className="preview-video"
      />
    </div>
  );

  /** ------------------------------------------------------------------
   * JSX
   * -----------------------------------------------------------------*/
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>×</button>

        {/* DESKTOP VIEW */}
        {!isMobile && (
          <>
            <button className="nav-left" onClick={prevVideo} disabled={currentIndex === 0}><FaArrowLeft /></button>
            <button className="nav-right" onClick={nextVideo} disabled={currentIndex === localVideos.length - 1}><FaArrowRight /></button>

            <div className="video-layout">
              {currentIndex > 0 && renderSideVideo(localVideos[currentIndex - 1], el => videoRefs.current[currentIndex - 1] = el, 'left')}

              <div className="center-video-container">
                <video
                  src={currentVideo.videoUrl.replace('http://', 'https://')}
                  muted={muted}
                  autoPlay
                  loop
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  ref={el => videoRefs.current[currentIndex] = el}
                  className={`center-video ${transitioning ? 'fade-out' : 'fade-in'}`}
                  poster={currentVideo.thumbnailUrl}
                />

                <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

                <div className="top-left"><button onClick={togglePlay}>{playing ? '⏸' : '▶️'}</button></div>
                <div className="top-right"><button onClick={toggleMute}>{muted ? '🔇' : '🔊'}</button></div>

                <div className="right-side-icons">
                  <span>
                    <button className="icon-btn" onClick={() => toggleLike(currentIndex)}>
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

              {currentIndex < localVideos.length - 1 && renderSideVideo(localVideos[currentIndex + 1], el => videoRefs.current[currentIndex + 1] = el, 'right')}
            </div>
          </>
        )}

        {/* MOBILE VIEW */}
        {isMobile && (
          <div className="mobile-reel-wrapper">
            {localVideos.map((video, idx) => {
              const id = video._id || video.id;
              const isLiked = likedVideos.includes(id);
              const lc = video.likes || 0;
              return (
                <div className="reel-container" key={id || idx}>
                  <video
                    src={video.videoUrl.replace('http://', 'https://')}
                    ref={el => videoRefs.current[idx] = el}
                    className="reel-video"
                    muted
                    loop
                    autoPlay
                    playsInline
                    poster={video.thumbnailUrl}
                  />
                  <div className="top-left"><button onClick={togglePlay}>{playing ? '⏸' : '▶️'}</button></div>
                  <div className="reel-progress"><div className="fill" style={{ width: `${progress}%` }} /></div>
                  <div className="top-right"><button onClick={toggleMute}>{muted ? '🔇' : '🔊'}</button></div>
                  <div className="right-side-icons">
                    <span>
                      <button className="icon-btn" onClick={() => toggleLike(idx)}>
                        {isLiked ? <FaHeart color="red" size={24} /> : <FaRegHeart color="white" size={24} />}
                      </button>
                      <p className="icon-count">{lc}</p>
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

        {showToast && <div className="toast-notification">Link copied to clipboard!</div>}

        {showShareModal && (
          <div className="share-modal">
            <div className="share-header">
              <p>Share</p>
              <button className="share-close" onClick={() => setShowShareModal(false)}>×</button>
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
                navigator.clipboard.writeText(currentVideo.videoUrl);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
              }}><FaLink size={28} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
