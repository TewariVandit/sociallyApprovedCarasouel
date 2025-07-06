const Video = require('../models/Video');

const getVideos = async (req, res) => {
  try {
    const videos = await Video.find(); // no .lean() — keeps Mongoose docs
    const serialized = videos.map(video => video.toJSON()); // apply virtuals

    res.json(serialized); // `id` included, `_id` & `__v` hidden
  } catch (err) {
    console.error('Error fetching videos:', err);
    res.status(500).json({ message: 'Server error while fetching videos.' });
  }
};


const likeVideo = async (req, res) => {
  const { videoId, liked } = req.body;

  console.log(`✅ Like request received: ${videoId}, liked: ${liked}`);

  try {
    const video = await Video.findById(videoId);
    if (!video) {
      console.log('❌ Video not found');
      return res.status(404).json({ message: 'Video not found' });
    }

    video.likes = liked ? video.likes + 1 : Math.max(video.likes - 1, 0);
    await video.save();

    console.log(`✅ Updated likes: ${video.likes}`);

    res.status(200).json({ likes: video.likes });
  } catch (err) {
    console.error('❌ Error updating like:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


const shareVideo = async (req, res) => {
  const { videoId, platform } = req.body;

  console.log(`✅ Share request received: ${videoId}, platform: ${platform}`);

  try {
    const video = await Video.findById(videoId);
    if (!video) {
      console.log('❌ Video not found');
      return res.status(404).json({ message: 'Video not found' });
    }

    video.shares.push({ platform, sharedAt: new Date() });
    await video.save();

    console.log(`✅ Shares updated. Total shares: ${video.shares.length}`);

    res.status(200).json({ shares: video.shares });
  } catch (err) {
    console.error('❌ Error updating share:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



// 👇 New test function to log video ID
const logVideoId = (req, res) => {
  const { id } = req.params;
  console.log("Received video ID:", id);
  res.status(200).json({ message: `Video ID is ${id}` });
};

module.exports = {
  getVideos,
  likeVideo,
  shareVideo,
  logVideoId, // <- export new function
};
