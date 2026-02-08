const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const cors = require("cors");

const app = express();
const PORT = 3000;

// CORS
app.use(cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ PERBAIKAN: Static files untuk assets
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// Content Security Policy
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; connect-src 'self' http://localhost:3000; img-src 'self' data: http://localhost:3000; script-src 'self'; style-src 'self';"
  );
  next();
});

// Pastikan folder games ada
const gamesDir = path.join(__dirname, "public/assets/games");
if (!fs.existsSync(gamesDir)) {
  fs.mkdirSync(gamesDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/assets/games');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Routes
const gameRoutes = require("./routes/games")(upload);
app.use("/api/games", gameRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Backend jalan 🚀");
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: err.message || "Server error" 
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});