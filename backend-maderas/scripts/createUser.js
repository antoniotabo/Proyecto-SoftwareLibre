const bcrypt = require('bcrypt');
const pool = require('../database/db');

async function createUser() {
  try {
    const nombre = 'Admin';
    const email = 'admin@demo.com';
    const password = 'admin123'; // La contraseña que usarás
    const rol = 'admin';
    const estado = 'ACTIVO';
    
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Eliminar usuario si ya existe
    await pool.query('DELETE FROM usuarios WHERE email = ?', [email]);
    
    // Crear nuevo usuario
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol, estado) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, hashedPassword, rol, estado]
    );
    
    console.log('✅ Usuario creado exitosamente!');
    console.log('==================================');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Rol:', rol);
    console.log('==================================');
    console.log('Usa estas credenciales para hacer login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
    process.exit(1);
  }
}

createUser();