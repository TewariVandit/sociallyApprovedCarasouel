const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: String, default: 'Anonymous' },
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const shareSchema = new mongoose.Schema({
  platform: String,
  sharedAt: { type: Date, default: Date.now }
});

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  likes: { type: Number, default: 0 },
  comments: [commentSchema],
  shares: [shareSchema]
}, { timestamps: true });

// ✅ Add virtual `id` to client response
videoSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString(); // expose clean id
    delete ret._id;              // hide Mongo's _id
    delete ret.__v;              // remove version field
  },
});

module.exports = mongoose.model('Video', videoSchema);
