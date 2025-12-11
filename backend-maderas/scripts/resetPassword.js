const bcrypt = require('bcrypt');
const pool = require('../database/db'); // Ajusta la ruta según tu config

async function resetPassword() {
  try {
    const email = 'admin@demo.com'; // El email del usuario Jefferson
    const newPassword = 'admin123'; // Nueva contraseña
    
    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar la contraseña
    await pool.query(
      'UPDATE usuarios SET password = ? WHERE email = ?',
      [hashedPassword, email]
    );
    
    console.log('✅ Contraseña actualizada exitosamente!');
    console.log('==================================');
    console.log('Email:', email);
    console.log('Nueva Password:', newPassword);
    console.log('==================================');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetPassword();