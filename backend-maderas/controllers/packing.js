const pool = require('../database/db.js');

// ✅ Listar cabeceras de Packing
exports.getPacking = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM packing ORDER BY fecha DESC');
    res.status(200).json(rows || []);
  } catch (err) {
    console.error('❌ Error en getPacking:', err);
    res.status(500).json({ error: 'Error al listar packing', detail: err.message });
  }
};

// ✅ Listar ítems de un Packing
exports.getPackingItems = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM packing_items WHERE packing_id = ?', [id]);
    res.status(200).json(rows || []);
  } catch (err) {
    console.error('❌ Error en getPackingItems:', err);
    res.status(500).json({ error: 'Error interno', detail: err.message });
  }
};

// ✅ Crear Packing + Items (Transacción)
exports.createPacking = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { fecha, cliente_id, especie, tipo_madera, observaciones, items = [] } = req.body;
    await conn.beginTransaction();

    // 1. Insertar Cabecera
    const [result] = await conn.query(
      `INSERT INTO packing(fecha, cliente_id, especie, tipo_madera, observaciones) VALUES (?, ?, ?, ?, ?)`,
      [fecha, cliente_id, especie, tipo_madera, observaciones || null]
    );
    const packingId = result.insertId;

    // 2. Insertar Ítems
    for (const item of items) {
      await conn.query(
        `INSERT INTO packing_items(packing_id, cantidad_piezas, e, a, l, volumen_pt, categoria) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [packingId, item.cantidad_piezas, item.e, item.a, item.l, item.volumen_pt, item.categoria || null]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Packing creado correctamente', id: packingId });
  } catch (err) {
    await conn.rollback();
    console.error('❌ Error en createPacking:', err);
    res.status(500).json({ error: 'Error al crear packing', detail: err.message });
  } finally {
    conn.release();
  }
};

// ✅ Actualizar Cabecera
exports.updatePacking = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, cliente_id, especie, tipo_madera, observaciones } = req.body;
    const [result] = await pool.query(
      `UPDATE packing SET fecha=?, cliente_id=?, especie=?, tipo_madera=?, observaciones=? WHERE id=?`,
      [fecha, cliente_id, especie, tipo_madera, observaciones || null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Packing no encontrado' });
    res.status(200).json({ message: 'Packing actualizado' });
  } catch (err) {
    console.error('❌ Error en updatePacking:', err);
    res.status(500).json({ error: 'Error al actualizar packing', detail: err.message });
  }
};

// ✅ ACTUALIZAR ITEM (Función de la Línea 38)
exports.updatePackingItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { cantidad_piezas, e, a, l, volumen_pt, categoria } = req.body;
    const [result] = await pool.query(
      `UPDATE packing_items SET cantidad_piezas=?, e=?, a=?, l=?, volumen_pt=?, categoria=? WHERE id=?`,
      [cantidad_piezas, e, a, l, volumen_pt, categoria || null, itemId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item no encontrado' });
    res.status(200).json({ message: 'Item actualizado' });
  } catch (err) {
    console.error('❌ Error en updatePackingItem:', err);
    res.status(500).json({ error: 'Error al actualizar item', detail: err.message });
  }
};

// ✅ ELIMINAR ITEM
exports.deletePackingItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const [result] = await pool.query('DELETE FROM packing_items WHERE id=?', [itemId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item no encontrado' });
    res.status(200).json({ message: 'Item eliminado' });
  } catch (err) {
    console.error('❌ Error en deletePackingItem:', err);
    res.status(500).json({ error: 'Error al eliminar item', detail: err.message });
  }
};

// ✅ Eliminar Packing completo (Transacción)
exports.deletePacking = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    await conn.beginTransaction();

    await conn.query('DELETE FROM packing_items WHERE packing_id=?', [id]);
    const [result] = await conn.query('DELETE FROM packing WHERE id=?', [id]);
    
    await conn.commit();
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Packing no encontrado' });
    res.status(200).json({ message: 'Packing eliminado' });
  } catch (err) {
    await conn.rollback();
    console.error('❌ Error en deletePacking:', err);
    res.status(500).json({ error: 'Error al eliminar packing', detail: err.message });
  } finally {
    conn.release();
  }
};