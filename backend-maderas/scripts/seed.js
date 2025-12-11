const pool = require('../database/db.js');

async function seed() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Transportistas
    await conn.query(
      `INSERT INTO transportistas (id, nombre, ruc, email, estado) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), ruc=VALUES(ruc), email=VALUES(email), estado=VALUES(estado)`,
      [1, 'TRANSPALH SAC', '12345678901', 'contacto@transpalh.com', 'ACTIVO']
    );

    // Clientes
    await conn.query(
      `INSERT INTO clientes (id, nombre, ruc, email, estado) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), ruc=VALUES(ruc), email=VALUES(email), estado=VALUES(estado)`,
      [1, 'LAD LUMBER SAC', '20123456789', 'ventas@ladlumber.com', 'ACTIVO']
    );

    // Proveedores
    await conn.query(
      `INSERT INTO proveedores (id, nombre, ruc, email, estado) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), ruc=VALUES(ruc), email=VALUES(email), estado=VALUES(estado)`,
      [1, 'NANDO GRANDA', '20987654321', 'proveedor@nando.com', 'ACTIVO']
    );

    await conn.commit();
    console.log('Seed ejecutado: transportistas, clientes, proveedores');
  } catch (err) {
    await conn.rollback();
    console.error('Error en seed:', err.message);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
