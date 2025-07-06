const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const videoRoutes = require('./routes/videoRoutes');

dotenv.config({
  path: path.resolve(__dirname, '../.env') // ensure correct path
});

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

console.log("Connecting to MongoDB...");

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    const PORT = process.env.PORT || 5000;

    // API routes
    app.use('/api', videoRoutes);

    // Serve static frontend
    const buildPath = path.join(__dirname, '../socially-approved-carousel/dist');
    const indexPath = path.join(buildPath, 'index.html');

    console.log("Resolved build path:", indexPath);

    if (fs.existsSync(indexPath)) {
      app.use(express.static(buildPath));

      // Safe catch-all only for non-API GET requests
      app.get(/^\/(?!api).*/, (req, res, next) => {
        try {
          res.sendFile(path.resolve(buildPath, 'index.html'));
        } catch (err) {
          next(err);
        }
      });
    } else {
      console.warn("⚠️ No build folder found. Run `npm run build` in /socially-approved-carousel.");
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
  });
