const pool = require('../database/db.js');

// Listar transportistas con filtros simples
exports.getTransportistas = async (req, res) => {
  try {
    const { q, estado } = req.query;
    let sql = 'SELECT id, nombre, ruc, contacto, estado FROM transportistas WHERE 1=1';
    const params = [];
    if (estado) { sql += ' AND estado = ?'; params.push(estado); }
    if (q) { sql += ' AND (nombre LIKE ? OR ruc LIKE ? OR contacto LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar transportistas', detail: err.message });
  }
};

// Obtener transportista por id
exports.getTransportistaById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id, nombre, ruc, contacto, estado FROM transportistas WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Transportista no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener transportista', detail: err.message });
  }
};

// Crear transportista
exports.createTransportista = async (req, res) => {
  try {
    const { nombre, ruc, contacto, estado = 'ACTIVO' } = req.body;
    const [result] = await pool.query(
      'INSERT INTO transportistas (nombre, ruc, contacto, estado) VALUES (?, ?, ?, ?)',
      [nombre, ruc, contacto || null, estado]
    );
    res.status(201).json({ message: 'Transportista creado', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear transportista', detail: err.message });
  }
};

// Actualizar transportista
exports.updateTransportista = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, ruc, contacto, estado } = req.body;
    const [result] = await pool.query(
      'UPDATE transportistas SET nombre = ?, ruc = ?, contacto = ?, estado = ? WHERE id = ?',
      [nombre, ruc, contacto || null, estado || 'ACTIVO', id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Transportista no encontrado' });
    res.json({ message: 'Transportista actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar transportista', detail: err.message });
  }
};

// Eliminar transportista
exports.deleteTransportista = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM transportistas WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Transportista no encontrado' });
    res.json({ message: 'Transportista eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar transportista', detail: err.message });
  }
};
