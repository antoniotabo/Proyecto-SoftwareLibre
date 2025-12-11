const pool = require('../database/db.js');

// Listar clientes
exports.getClientes = async (req, res) => {
  try {
    const { q, estado } = req.query;
    let sql = 'SELECT id, razon_social, ruc, contacto, estado FROM clientes WHERE 1=1';
    const params = [];

    if (estado) {
      sql += ' AND estado = ?';
      params.push(estado);
    }
    if (q) {
      sql += ' AND (razon_social LIKE ? OR ruc LIKE ? OR contacto LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const [rows] = await pool.query(sql, params);
    // IMPORTANTE: Siempre devolver un array, aunque esté vacío
    res.status(200).json(rows || []);
  } catch (err) {
    console.error('Error al listar clientes:', err);
    res.status(500).json({ error: 'Error al listar clientes', detail: err.message });
  }
};

// Obtener cliente
exports.getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
};

// Crear cliente
exports.createCliente = async (req, res) => {
  try {
    // Validar datos mínimos
    const { razon_social, ruc, contacto, estado = 'ACTIVO' } = req.body;
    if (!razon_social) return res.status(400).json({ error: 'Razón Social es obligatoria' });

    const [result] = await pool.query(
      'INSERT INTO clientes (razon_social, ruc, contacto, estado) VALUES (?, ?, ?, ?)',
      [razon_social, ruc, contacto || null, estado]
    );

    // Respuesta estándar que Angular espera
    res.status(201).json({ 
        message: 'Cliente creado correctamente', 
        id: result.insertId,
        data: { id: result.insertId, razon_social, ruc, contacto, estado }
    });
  } catch (err) {
    console.error('Error al crear cliente:', err);
    res.status(500).json({ error: 'Error al crear cliente', detail: err.message });
  }
};

// Actualizar cliente
exports.updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { razon_social, ruc, contacto, estado } = req.body;

    const [result] = await pool.query(
      'UPDATE clientes SET razon_social = ?, ruc = ?, contacto = ?, estado = ? WHERE id = ?',
      [razon_social, ruc, contacto, estado, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ message: 'Cliente actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar' });
  }
};

// Eliminar cliente (Lógico preferiblemente)
exports.deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    // Recomendado: Borrado lógico para no romper historial de facturas
    // const [result] = await pool.query('UPDATE clientes SET estado = "INACTIVO" WHERE id = ?', [id]);
    
    // Borrado físico (Si estás seguro que no tiene facturas)
    const [result] = await pool.query('DELETE FROM clientes WHERE id = ?', [id]);

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ message: 'Cliente eliminado' });
  } catch (err) {
    console.error(err);
    // Error de Foreign Key (tiene facturas asociadas)
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ error: 'No se puede eliminar: El cliente tiene facturas o historial asociado.' });
    }
    res.status(500).json({ error: 'Error al eliminar' });
  }
};