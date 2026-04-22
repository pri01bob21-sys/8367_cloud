const express = require('express');
const app = express();
const pool = require('./db');
const cors = require('cors');

app.use(cors());
app.use(express.json());

/* 🔹 POST - switch will hit this */
app.post('/update_switch', async (req, res) => {
  try {
    const jsonData = req.body;

    await pool.query(
      'INSERT INTO switch_data (data) VALUES ($1)',
      [jsonData]
    );

    res.json({ message: 'Data stored successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error storing data');
  }
});

/* 🔹 GET - frontend will hit this */
app.get('/get_data', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM switch_data ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Error fetching data');
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});