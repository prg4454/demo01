"use strict";

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize, Item, Cat } from './models/index.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the demo01 Backend API with Sequelize',
    status: 'Running'
  });
});

// Health check endpoint (checks DB connectivity as well)
app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: 'OK',
      database: 'Connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'Degraded',
      database: 'Disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all cats from SQLite through Sequelize.
app.get('/api/cats', async (req, res, next) => {
  try {
    const cats = await Cat.findAll({ order: [['id', 'DESC']] });
    res.json(cats);
  } catch (error) {
    next(error);
  }
});

// --- CRUD Routes for Items (Sequelize Model) ---

// 1. Get all items
app.get('/api/items', async (req, res, next) => {
  try {
    const items = await Item.findAll({ order: [['id', 'DESC']] });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// 2. Get item by ID
app.get('/api/items/:id', async (req, res, next) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// 3. Create a new item
app.post('/api/items', async (req, res, next) => {
  try {
    const { title, description, completed } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const newItem = await Item.create({
      title: title.trim(),
      description,
      completed: completed ?? false
    });
    res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
});

// 4. Update an item
app.put('/api/items/:id', async (req, res, next) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const { title, description, completed } = req.body;
    await item.update({
      title: title !== undefined ? title : item.title,
      description: description !== undefined ? description : item.description,
      completed: completed !== undefined ? completed : item.completed
    });

    res.json(item);
  } catch (error) {
    next(error);
  }
});

// 5. Delete an item
app.delete('/api/items/:id', async (req, res, next) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await item.destroy();
    res.json({ message: 'Item deleted successfully', id: Number(req.params.id) });
  } catch (error) {
    next(error);
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} does not exist.`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.'
  });
});

// Initialize Database and Start Server
async function startServer() {
  try {
    // Authenticate and synchronize models with database
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    await sequelize.sync();
    console.log('All models were synchronized successfully.');

    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();

export default app;
