// database/acceso_usuarios.js

// Importamos la función de consulta de nuestra conexión MySQL
const { query } = require('./db'); 


/**
 * Busca un usuario por su email en la tabla 'usuarios'.
 * @param {string} email
 * @returns {object|null} El objeto usuario (primera fila) o null si no se encuentra.
 */
const buscarUsuarioPorEmail = async (email) => {
    // ⚠️ Asegúrate de que las columnas coincidan con tu tabla
    const sql = 'SELECT id, nombre, email, password, rol, estado FROM usuarios WHERE email = ? LIMIT 1';
    
    try {
        const rows = await query(sql, [email]);
        return rows[0] || null;

    } catch (error) {
        console.error("Error al buscar usuario en MySQL (DAO):", error);
        throw new Error('Error de base de datos al buscar usuario'); 
    }
};

/**
 * Inserta un nuevo usuario en la tabla 'usuarios'.
 * @param {object} usuarioDatos - Objeto con { nombre, email, password (hash), rol }
 * @returns {number} El ID del nuevo registro insertado.
 */
const crearNuevoUsuario = async (usuarioDatos) => {
    const sql = 'INSERT INTO usuarios (nombre, email, password, rol, estado) VALUES (?, ?, ?, ?, "ACTIVO")';
    
    try {
        const resultado = await query(sql, [
            usuarioDatos.nombre, 
            usuarioDatos.email, 
            usuarioDatos.password, 
            usuarioDatos.rol || 'user'
        ]);
        
        return resultado.insertId; 

    } catch (error) {
        if (error.message.includes('Duplicate entry')) {
            throw new Error('El email ya está en uso');
        }
        console.error("Error al insertar nuevo usuario en MySQL (DAO):", error);
        throw new Error('Error de base de datos al crear usuario'); 
    }
};


module.exports = {
    buscarUsuarioPorEmail,
    crearNuevoUsuario,
};