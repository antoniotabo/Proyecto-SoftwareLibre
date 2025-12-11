const express = require('express');
const app = express();
const cors = require('cors');
const routes = require('../routes/routes.js');
require('dotenv').config();

app.use(express.json());
app.use(cors());

// Rutas principales
app.use('/api', routes);

// Ruta raíz
app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente");
});

// Middleware de manejo de errores (único y centralizado)
app.use((err, req, res, next) => {
  console.error(err.stack); // log en consola

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'No autorizado' });
  }

  res.status(500).json({ error: 'Error interno del servidor' });
});


// Arranque del servidor
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});