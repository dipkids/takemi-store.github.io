const express = require("express");

module.exports = (upload) => {
  const router = express.Router();
  let games = []; // temporary storage (gunakan database untuk production)

  // GET all games
  router.get("/", (req, res) => {
    res.json({ success: true, games });
  });

  // POST new game
  router.post("/", upload.single("gameImage"), (req, res) => {
    try {
      console.log("Request body:", req.body);
      console.log("Request file:", req.file);

      const { gameTitle, gameDescription, gameBadge, gameRating, gameReviews, gameSold } = req.body;
      
      // Validasi field wajib
      if (!gameTitle || !gameDescription) {
        return res.status(400).json({ 
          success: false, 
          message: "Title and description are required" 
        });
      }

      // Validasi file
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "Image is required" 
        });
      }

      const newGame = {
        id: Date.now(),
        title: gameTitle,
        description: gameDescription,
        badge: gameBadge || "",
        rating: parseFloat(gameRating) || 4.5,
        reviews: parseInt(gameReviews) || 0,
        sold: parseInt(gameSold) || 0,
        image: `/assets/games/${req.file.filename}`
      };

      games.push(newGame);
      
      console.log("Game added successfully:", newGame);
      
      res.json({ success: true, game: newGame });
    } catch (err) {
      console.error("Error in POST /api/games:", err);
      res.status(500).json({ 
        success: false, 
        message: "Server error: " + err.message 
      });
    }
  });

  // DELETE game by ID
  router.delete("/:id", (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const index = games.findIndex(g => g.id === gameId);
      
      if (index === -1) {
        return res.status(404).json({ 
          success: false, 
          message: "Game not found" 
        });
      }
      
      games.splice(index, 1);
      res.json({ success: true, message: "Game deleted" });
    } catch (err) {
      console.error("Error in DELETE /api/games/:id:", err);
      res.status(500).json({ 
        success: false, 
        message: "Server error: " + err.message 
      });
    }
  });

  // UPDATE game by ID
  router.put("/:id", upload.single("gameImage"), (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const index = games.findIndex(g => g.id === gameId);
      
      if (index === -1) {
        return res.status(404).json({ 
          success: false, 
          message: "Game not found" 
        });
      }

      const { gameTitle, gameDescription, gameBadge, gameRating, gameReviews, gameSold } = req.body;

      // Update game data
      games[index] = {
        ...games[index],
        title: gameTitle || games[index].title,
        description: gameDescription || games[index].description,
        badge: gameBadge !== undefined ? gameBadge : games[index].badge,
        rating: gameRating ? parseFloat(gameRating) : games[index].rating,
        reviews: gameReviews ? parseInt(gameReviews) : games[index].reviews,
        sold: gameSold ? parseInt(gameSold) : games[index].sold,
        image: req.file ? `/assets/games/${req.file.filename}` : games[index].image
      };

      res.json({ success: true, game: games[index] });
    } catch (err) {
      console.error("Error in PUT /api/games/:id:", err);
      res.status(500).json({ 
        success: false, 
        message: "Server error: " + err.message 
      });
    }
  });

  return router;
};
