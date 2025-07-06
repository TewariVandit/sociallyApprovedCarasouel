const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const videoRoutes = require('./routes/videoRoutes');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Debug: Check if .env loaded properly
console.log("Connecting to:", process.env.MONGO_URI);

app.use('/api', videoRoutes);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ MongoDB connected");
  app.listen(process.env.PORT, () => {
    console.log(`🚀 Server running on port ${process.env.PORT}`);
  });
}).catch(err => {
  console.error("❌ MongoDB connection failed:", err.message);
});
