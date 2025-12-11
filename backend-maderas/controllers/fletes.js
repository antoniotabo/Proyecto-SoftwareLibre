const pool = require('../database/db.js');

// GET con filtros avanzados
exports.getFletes = async (req, res) => {
  try {
    const { transportistaId, estado, desde, hasta, q } = req.query;
    let sql = 'SELECT * FROM fletes WHERE 1=1';
    const params = [];
    if (transportistaId) { sql += ' AND transportista_id = ?'; params.push(transportistaId); }
    if (estado) { sql += ' AND estado = ?'; params.push(estado); }
    if (desde) { sql += ' AND fecha >= ?'; params.push(desde); }
    if (hasta) { sql += ' AND fecha <= ?'; params.push(hasta); }
    if (q) {
      sql += ' AND (guia_remitente LIKE ? OR guia_transportista LIKE ? OR detalle_carga LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar fletes', detail: err.message });
  }
};

// POST crear
exports.createFlete = async (req, res) => {
  try {
    const {
      fecha, transportista_id, guia_remitente, guia_transportista,
      detalle_carga, valor_flete, adelanto = 0, pago = 0,
      observacion, fecha_cancelacion
    } = req.body;

    const sql = `
      INSERT INTO fletes (fecha, transportista_id, guia_remitente, guia_transportista, detalle_carga,
                          valor_flete, adelanto, pago, observacion, fecha_cancelacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      fecha, transportista_id, guia_remitente, guia_transportista, detalle_carga,
      valor_flete, adelanto, pago, observacion || null, fecha_cancelacion || null
    ];
    const [result] = await pool.query(sql, params);
    res.status(201).json({ message: 'Flete creado', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear flete', detail: err.message });
  }
};

// PUT actualizar
exports.updateFlete = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fecha, transportista_id, guia_remitente, guia_transportista,
      detalle_carga, valor_flete, adelanto, pago, observacion, fecha_cancelacion
    } = req.body;

    const sql = `
      UPDATE fletes SET
        fecha = ?, transportista_id = ?, guia_remitente = ?, guia_transportista = ?,
        detalle_carga = ?, valor_flete = ?, adelanto = ?, pago = ?,
        observacion = ?, fecha_cancelacion = ?
      WHERE id = ?
    `;
    const params = [
      fecha, transportista_id, guia_remitente, guia_transportista,
      detalle_carga, valor_flete, adelanto ?? 0, pago ?? 0,
      observacion || null, fecha_cancelacion || null, id
    ];
    const [result] = await pool.query(sql, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Flete no encontrado' });
    res.json({ message: 'Flete actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar flete', detail: err.message });
  }
};

// DELETE eliminar
exports.deleteFlete = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM fletes WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Flete no encontrado' });
    res.json({ message: 'Flete eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar flete', detail: err.message });
  }
};
