const pool = require('../database/db.js');

// ✅ Listar facturas + totales calculados (Vista SQL)
exports.getFacturas = async (req, res) => {
  try {
    const { clienteId, estado, desde, hasta, q } = req.query;
    
    // Hacemos JOIN con la vista v_facturas_totales y la tabla clientes para tener nombres
    let sql = `
      SELECT 
        f.*, 
        c.razon_social AS cliente_nombre,
        vt.total, 
        vt.igv, 
        vt.total_con_igv, 
        vt.detraccion, 
        vt.saldo
      FROM facturas f
      LEFT JOIN v_facturas_totales vt ON f.id = vt.id
      LEFT JOIN clientes c ON f.cliente_id = c.id
      WHERE 1=1
    `;
    
    const params = [];

    if (clienteId) { 
        sql += ' AND f.cliente_id = ?'; 
        params.push(clienteId); 
    }
    if (estado) { 
        sql += ' AND f.estado = ?'; 
        params.push(estado); 
    }
    if (desde) { 
        sql += ' AND f.fecha >= ?'; 
        params.push(desde); 
    }
    if (hasta) { 
        sql += ' AND f.fecha <= ?'; 
        params.push(hasta); 
    }
    if (q) {
      sql += ' AND (f.factura_nro LIKE ? OR f.guia_nro LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }

    // Ordenar por fecha reciente
    sql += ' ORDER BY f.fecha DESC';

    const [rows] = await pool.query(sql, params);
    res.status(200).json(rows || []);

  } catch (err) {
    console.error('❌ Error en getFacturas:', err);
    res.status(500).json({ error: 'Error al listar facturas', detail: err.message });
  }
};

// ✅ Obtener ítems de una factura
exports.getFacturaItems = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM factura_items WHERE factura_id = ?', [id]);
    res.status(200).json(rows || []);
  } catch (err) {
    console.error('❌ Error en getFacturaItems:', err);
    res.status(500).json({ error: 'Error interno', detail: err.message });
  }
};

// ✅ Crear Factura + Items (Transacción)
exports.createFactura = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { 
        fecha, cliente_id, factura_nro, guia_nro, 
        descripcion, igv_pct, detraccion_pct, items = [] 
    } = req.body;

    await conn.beginTransaction();

    // 1. Insertar Cabecera
    const [result] = await conn.query(
      `INSERT INTO facturas(fecha, cliente_id, factura_nro, guia_nro, descripcion, igv_pct, detraccion_pct)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        fecha, cliente_id, factura_nro, guia_nro, 
        descripcion || null, igv_pct || 0.18, detraccion_pct || 0.04
      ]
    );
    const facturaId = result.insertId;

    // 2. Insertar Ítems (si existen)
    if (items && items.length > 0) {
        for (const item of items) {
          await conn.query(
            `INSERT INTO factura_items(factura_id, producto, cantidad, precio_unit) VALUES (?, ?, ?, ?)`,
            [facturaId, item.producto, item.cantidad, item.precio_unit]
          );
        }
    }

    await conn.commit();
    res.status(201).json({ message: 'Factura creada exitosamente', id: facturaId });

  } catch (err) {
    await conn.rollback();
    console.error('❌ Error en createFactura:', err);
    res.status(500).json({ error: 'Error al crear factura', detail: err.message });
  } finally {
    conn.release();
  }
};

// ✅ Actualizar Factura
exports.updateFactura = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, cliente_id, factura_nro, guia_nro, descripcion, igv_pct, detraccion_pct, estado } = req.body;
    
    const [result] = await pool.query(
      `UPDATE facturas SET 
        fecha=?, cliente_id=?, factura_nro=?, guia_nro=?, 
        descripcion=?, igv_pct=?, detraccion_pct=?, estado=? 
       WHERE id=?`,
      [
        fecha, cliente_id, factura_nro, guia_nro, 
        descripcion || null, igv_pct ?? 0.18, detraccion_pct ?? 0.04, 
        estado || 'EMITIDA', id
      ]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Factura no encontrada' });
    }
    res.status(200).json({ message: 'Factura actualizada' });

  } catch (err) {
    console.error('❌ Error en updateFactura:', err);
    res.status(500).json({ error: 'Error al actualizar', detail: err.message });
  }
};

// ✅ Eliminar Factura (Transacción: Items -> Cobranzas -> Factura)
exports.deleteFactura = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    await conn.beginTransaction();

    // Borrar dependencias
    await conn.query('DELETE FROM factura_items WHERE factura_id=?', [id]);
    await conn.query('DELETE FROM cobranzas WHERE factura_id=?', [id]);
    
    // Borrar cabecera
    const [result] = await conn.query('DELETE FROM facturas WHERE id=?', [id]);

    await conn.commit();

    if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Factura no encontrada' });
    }
    res.status(200).json({ message: 'Factura eliminada' });

  } catch (err) {
    await conn.rollback();
    console.error('❌ Error en deleteFactura:', err);
    res.status(500).json({ error: 'Error al eliminar', detail: err.message });
  } finally {
    conn.release();
  }
};

// ✅ Registrar Cobranza
exports.registrarCobranza = async (req, res) => {
  try {
    const { factura_id, fecha, anticipo = 0, entregado = 0 } = req.body;
    await pool.query(
      `INSERT INTO cobranzas(factura_id, fecha, anticipo, entregado) VALUES (?, ?, ?, ?)`,
      [factura_id, fecha, anticipo, entregado]
    );
    res.status(201).json({ message: 'Cobranza registrada' });
  } catch (err) {
    console.error('❌ Error en registrarCobranza:', err);
    res.status(500).json({ error: 'Error al registrar cobranza', detail: err.message });
  }
};