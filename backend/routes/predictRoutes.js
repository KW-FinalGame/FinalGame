// backend/routes/predictRoutes.js

const express = require('express');
const router = express.Router();

router.post('/predict', async (req, res) => {
  try {
    const flaskBase = process.env.FLASK_URL || 'http://127.0.0.1:5000';

    const response = await fetch(`${flaskBase}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sequence: req.body.sequence, roomId: req.body.roomId })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return res.json(data);

  } catch (e) {
    console.error("❌ Flask 중계 오류:", e.message);
    res.status(500).json({ error: 'predict failed' });
  }
});

router.post('/reset', async (req, res) => {
  try {
    const flaskBase = process.env.FLASK_URL || 'http://127.0.0.1:5000';

    const response = await fetch(`${flaskBase}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: req.body.roomId })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return res.json(data);

  } catch (e) {
    console.error("❌ Flask reset 중계 오류:", e.message);
    res.status(500).json({ error: 'reset failed' });
  }
});

module.exports = router;
