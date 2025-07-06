const express = require('express');
const router = express.Router();
const {
  getVideos,
  likeVideo,
  shareVideo
} = require('../controllers/videoController');

// List videos
router.get('/videos', getVideos);

// Like a video
router.post('/videos/like', likeVideo);

// Share a video
router.post('/videos/:videoId/share', shareVideo);

module.exports = router;
