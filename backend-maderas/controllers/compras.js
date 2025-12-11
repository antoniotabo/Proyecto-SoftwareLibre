const pool = require('../database/db.js');

// ✅ Listar compras (Blindado para devolver siempre array)
exports.getCompras = async (req, res) => {
  try {
    const { proveedorId, estado, tipo, desde, hasta, q } = req.query;
    let sql = 'SELECT * FROM compras WHERE 1=1';
    const params = [];

    // Filtros dinámicos
    if (proveedorId) { 
        sql += ' AND proveedor_id = ?'; 
        params.push(proveedorId); 
    }
    if (estado) { 
        sql += ' AND estado = ?'; 
        params.push(estado); 
    }
    if (desde) { 
        sql += ' AND fecha >= ?'; 
        params.push(desde); 
    }
    if (hasta) { 
        sql += ' AND fecha <= ?'; 
        params.push(hasta); 
    }
    if (q) { 
        sql += ' AND (tipo_producto LIKE ?)'; 
        params.push(`%${q}%`); 
    }
    
    // Ordenar por fecha descendente (más recientes primero)
    sql += ' ORDER BY fecha DESC';

    const [rows] = await pool.query(sql, params);
    
    // IMPORTANTE: Devolver array vacío si no hay resultados
    res.status(200).json(rows || []);

  } catch (err) {
    console.error('❌ Error en getCompras:', err);
    res.status(500).json({ error: 'Error al listar compras', detail: err.message });
  }
};

// ✅ Obtener gastos de una compra específica
exports.getCompraGastos = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM compras_gastos WHERE compra_id = ?', [id]);
    res.status(200).json(rows || []);
  } catch (err) {
    console.error('❌ Error en getCompraGastos:', err);
    res.status(500).json({ error: 'Error al listar gastos', detail: err.message });
  }
};

// ✅ Crear nueva compra
exports.createCompra = async (req, res) => {
  try {
    const { 
        proveedor_id, fecha, tipo_producto, 
        cantidad_pt, precio_pt, anticipo = 0, estado = 'PENDIENTE' 
    } = req.body;

    // Validación básica
    if (!proveedor_id || !fecha) {
        return res.status(400).json({ error: 'Faltan datos obligatorios (proveedor, fecha)' });
    }

    const sql = `
      INSERT INTO compras(proveedor_id, fecha, tipo_producto, cantidad_pt, precio_pt, anticipo, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(sql, [
        proveedor_id, fecha, tipo_producto, 
        cantidad_pt, precio_pt, anticipo, estado
    ]);

    res.status(201).json({ 
        message: 'Compra creada correctamente', 
        id: result.insertId 
    });

  } catch (err) {
    console.error('❌ Error en createCompra:', err);
    res.status(500).json({ error: 'Error al crear compra', detail: err.message });
  }
};

// ✅ Actualizar compra
exports.updateCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
        proveedor_id, fecha, tipo_producto, 
        cantidad_pt, precio_pt, anticipo, estado 
    } = req.body;

    const [result] = await pool.query(
      `UPDATE compras SET 
        proveedor_id=?, fecha=?, tipo_producto=?, 
        cantidad_pt=?, precio_pt=?, anticipo=?, estado=? 
       WHERE id=?`,
      [proveedor_id, fecha, tipo_producto, cantidad_pt, precio_pt, anticipo ?? 0, estado || 'PENDIENTE', id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Compra no encontrada' });
    }

    res.status(200).json({ message: 'Compra actualizada' });

  } catch (err) {
    console.error('❌ Error en updateCompra:', err);
    res.status(500).json({ error: 'Error al actualizar compra', detail: err.message });
  }
};

// ✅ Eliminar compra (Transacción para borrar gastos asociados primero)
exports.deleteCompra = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    
    await conn.beginTransaction();

    // 1. Borrar gastos asociados
    await conn.query('DELETE FROM compras_gastos WHERE compra_id=?', [id]);
    
    // 2. Borrar la compra
    const [result] = await conn.query('DELETE FROM compras WHERE id=?', [id]);

    await conn.commit();

    if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Compra no encontrada' });
    }
    
    res.status(200).json({ message: 'Compra eliminada correctamente' });

  } catch (err) {
    await conn.rollback();
    console.error('❌ Error en deleteCompra:', err);
    res.status(500).json({ error: 'Error al eliminar compra', detail: err.message });
  } finally {
    conn.release();
  }
};

// ✅ Registrar gasto adicional a una compra
exports.registrarGasto = async (req, res) => {
  try {
    const { compra_id, concepto, monto, fecha } = req.body;
    
    await pool.query(
      `INSERT INTO compras_gastos(compra_id, concepto, monto, fecha) VALUES (?, ?, ?, ?)`,
      [compra_id, concepto, monto, fecha]
    );

    res.status(201).json({ message: 'Gasto registrado' });

  } catch (err) {
    console.error('❌ Error en registrarGasto:', err);
    res.status(500).json({ error: 'Error al registrar gasto', detail: err.message });
  }
};