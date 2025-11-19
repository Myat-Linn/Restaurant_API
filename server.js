const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
// Use the PORT variable from the .env file, defaulting to 3000
const PORT = process.env.PORT || 3000; 
// Use the DATABASE_URL variable from the .env file
const DATABASE_URL = process.env.DATABASE_URL;

// Check if the database URL is loaded
if (!DATABASE_URL) {
    console.error("FATAL ERROR: DATABASE_URL not found in environment variables.");
    process.exit(1);
}

// Middleware
app.use(cors());
app.use(bodyParser.json());

// --- DATABASE CONNECTION ---
// mysql2 automatically parses the connection string (DATABASE_URL)
// and handles the necessary connection parameters, including SSL.
const pool = mysql.createPool(DATABASE_URL);

// Test Connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to TiDB:', err);
        // Display the configuration that failed (excluding credentials for safety)
        console.log(`Attempted connection to: ${DATABASE_URL.split('@')[1]}`);
        return;
    }
    console.log('Successfully connected to TiDB!');
    connection.release();
});

// --- CRUD ROUTES ---
app.get('/', (req, res) => {
    res.json({ 
        message: 'Welcome to the TiDB Menu API!',
        status: 'Operational',
        endpoints: {
            getAll: '/api/menu (GET)',
            getOne: '/api/menu/:id (GET)',
            create: '/api/menu (POST)',
            update: '/api/menu/:id (PUT)',
            delete: '/api/menu/:id (DELETE)'
        },
        next_step: 'Use the /api/menu endpoints or connect your Flutter app.'
    });
});

// 1. CREATE: Add a new menu item
app.post('/api/menu', (req, res) => {
    const { name, description, price, image_url } = req.body;
    const sql = 'INSERT INTO menu_items (name, description, price, image_url) VALUES (?, ?, ?, ?)';
    
    pool.query(sql, [name, description, price, image_url], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Item added', id: result.insertId });
    });
});

// 2. READ: Get all menu items
app.get('/api/menu', (req, res) => {
    const sql = 'SELECT * FROM menu_items';
    
    pool.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 3. READ: Get single menu item by ID (*** NEW ROUTE ***)
app.get('/api/menu/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM menu_items WHERE id = ?';

    pool.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json(results[0]);
    });
});

// 3. UPDATE: Edit an existing item
app.put('/api/menu/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, price, image_url } = req.body;
    const sql = 'UPDATE menu_items SET name = ?, description = ?, price = ?, image_url = ? WHERE id = ?';

    pool.query(sql, [name, description, price, image_url, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Item updated' });
    });
});

// 4. DELETE: Remove an item
app.delete('/api/menu/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM menu_items WHERE id = ?';

    pool.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Item deleted' });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/menu`);
});

module.exports = app;