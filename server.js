import express from 'express';
import cors from 'cors';
import { DatabaseSync } from 'node:sqlite';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Inicializar la base de datos SQLite usando la librería nativa de Node.js
const db = new DatabaseSync('database.sqlite');
db.exec('PRAGMA journal_mode = WAL');

// Lista de colecciones (tablas)
const collections = [
  'products',
  'sales',
  'sellers',
  'expenses',
  'suppliers',
  'purchases',
  'goals',
  'closures'
];

// Crear las tablas dinámicamente simulando un entorno NoSQL (Document Store)
collections.forEach((collection) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${collection} (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    )
  `);
});

// GET: Obtener todos los documentos de una colección
app.get('/api/:collection', (req, res) => {
  const { collection } = req.params;
  
  if (!collections.includes(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }

  try {
    const stmt = db.prepare(`SELECT data FROM ${collection}`);
    const rows = stmt.all();
    const result = rows.map(row => JSON.parse(row.data));
    res.json(result);
  } catch (error) {
    console.error(`Error GET /api/${collection}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST: Guardar o actualizar un documento
app.post('/api/:collection', (req, res) => {
  const { collection } = req.params;
  const item = req.body;

  if (!collections.includes(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }

  if (!item || !item.id) {
    return res.status(400).json({ error: 'Item must have an id' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO ${collection} (id, data)
      VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET data=excluded.data
    `);
    
    stmt.run(item.id, JSON.stringify(item));
    res.json({ success: true, id: item.id });
  } catch (error) {
    console.error(`Error POST /api/${collection}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST: Limpiar todo el sistema (borrar todas las tablas)
app.post('/api/system/clear-all', (req, res) => {
  try {
    db.exec('BEGIN TRANSACTION');
    collections.forEach((collection) => {
      db.exec(`DELETE FROM ${collection}`);
    });
    db.exec('COMMIT');
    res.json({ success: true });
  } catch (error) {
    console.error('Error in /api/system/clear-all:', error);
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE: Eliminar un documento por ID
app.delete('/api/:collection/:id', (req, res) => {
  const { collection, id } = req.params;

  if (!collections.includes(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }

  try {
    const stmt = db.prepare(`DELETE FROM ${collection} WHERE id = ?`);
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    console.error(`Error DELETE /api/${collection}/${id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST (Batch): Guardar múltiples documentos
app.post('/api/:collection/batch', (req, res) => {
  const { collection } = req.params;
  const items = req.body; // Debería ser un array

  if (!collections.includes(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Body must be an array of items' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO ${collection} (id, data)
      VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET data=excluded.data
    `);
    
    db.exec('BEGIN TRANSACTION');
    for (const item of items) {
      if (item && item.id) {
        stmt.run(item.id, JSON.stringify(item));
      }
    }
    db.exec('COMMIT');
    res.json({ success: true, count: items.length });
  } catch (error) {
    console.error(`Error POST /api/${collection}/batch:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`✅ Servidor SQLite escuchando en http://localhost:${port}`);
});
