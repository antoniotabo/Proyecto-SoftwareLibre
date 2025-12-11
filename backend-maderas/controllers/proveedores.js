const pool = require('../database/db.js');

// 🔍 Listar proveedores con filtros opcionales
exports.getProveedores = async (req, res) => {
  try {
    const { q, estado } = req.query;
    let sql = 'SELECT id, nombre, ruc, contacto, estado FROM proveedores WHERE 1=1';
    const params = [];

    if (estado) {
      sql += ' AND estado = ?';
      params.push(estado);
    }

    if (q) {
      sql += ' AND (nombre LIKE ? OR ruc LIKE ? OR contacto LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const [rows] = await pool.query(sql, params);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error al listar proveedores:', err);
    res.status(500).json({ error: 'Error al listar proveedores', detail: err.message });
  }
};

// 🔍 Obtener proveedor por ID
exports.getProveedorById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT id, nombre, ruc, contacto, estado FROM proveedores WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error al obtener proveedor:', err);
    res.status(500).json({ error: 'Error al obtener proveedor', detail: err.message });
  }
};

// 🆕 Crear proveedor
exports.createProveedor = async (req, res) => {
  try {
    const { nombre, ruc, contacto, estado = 'ACTIVO' } = req.body;

    const [result] = await pool.query(
      'INSERT INTO proveedores (nombre, ruc, contacto, estado) VALUES (?, ?, ?, ?)',
      [nombre, ruc, contacto || null, estado]
    );

    res.status(201).json({ message: 'Proveedor creado', id: result.insertId });
  } catch (err) {
    console.error('Error al crear proveedor:', err);
    res.status(500).json({ error: 'Error al crear proveedor', detail: err.message });
  }
};

// ✏️ Actualizar proveedor
exports.updateProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, ruc, contacto, estado } = req.body;

    const [result] = await pool.query(
      'UPDATE proveedores SET nombre = ?, ruc = ?, contacto = ?, estado = ? WHERE id = ?',
      [nombre, ruc, contacto || null, estado || 'ACTIVO', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.status(200).json({ message: 'Proveedor actualizado' });
  } catch (err) {
    console.error('Error al actualizar proveedor:', err);
    res.status(500).json({ error: 'Error al actualizar proveedor', detail: err.message });
  }
};

// 🗑 Eliminar proveedor
exports.deleteProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM proveedores WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.status(200).json({ message: 'Proveedor eliminado' });
  } catch (err) {
    console.error('Error al eliminar proveedor:', err);
    res.status(500).json({ error: 'Error al eliminar proveedor', detail: err.message });
  }
};