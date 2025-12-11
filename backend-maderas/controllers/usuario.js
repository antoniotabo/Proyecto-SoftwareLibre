const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
// Importamos las funciones DAO para el acceso a la DB
const { buscarUsuarioPorEmail, crearNuevoUsuario } = require('../database/acceso_usuario');
// Función auxiliar para validación de email simple
const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// --- AUTENTICACIÓN ---

/**
 * 📝 Registrar un nuevo usuario (Signup)
 */
exports.register = async (req, res, next) => {
    try {
        const { nombre, email, password, rol } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Faltan campos obligatorios: nombre, email y password.' });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Formato de email inválido.' });
        }
        
        // 1. Verificar si ya existe antes de hashear
        const usuarioExistente = await buscarUsuarioPorEmail(email);
        if (usuarioExistente) {
             return res.status(409).json({ error: 'El email ya se encuentra registrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 2. Usar la función DAO para insertar
        const nuevoUsuarioId = await crearNuevoUsuario({ nombre, email, password: hashedPassword, rol });

        res.status(201).json({ message: 'Usuario registrado exitosamente', id: nuevoUsuarioId });
    } catch (err) {
        if (err.message.includes('El email ya está en uso')) {
             return res.status(409).json({ error: 'El email ya se encuentra registrado.' });
        }
        next(err); 
    }
};

/**
 * 🔑 Iniciar sesión (Login)
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        // 1. Usar la función DAO para buscar
        const user = await buscarUsuarioPorEmail(email);

        if (!user || user.estado !== 'ACTIVO') {
            // Mensaje genérico para no dar pistas al atacante
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // 2. Comparación de contraseñas
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
             // Mensaje genérico
             return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // 3. Generación del token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 4. Respuesta exitosa
        res.json({ 
            token, 
            user: { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre } 
        });

    } catch (err) {
        next(err);
    }
};

// --- FUNCIONES DE ADMINISTRACIÓN (CRUD) ---
// NOTA: Estas funciones deben actualizarse para usar el pool.query o migrarse a una capa DAO dedicada
const pool = require('../database/db').pool;

// --- FUNCIONES DE ADMINISTRACIÓN (CRUD) ---

/**
 * 👥 Listar todos los usuarios
 * @route GET /api/usuarios
 * REQUIERE: Middleware de autenticación y rol 'admin'
 */
exports.getUsuarios = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT id, nombre, email, rol, estado FROM usuarios');
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

/**
 * 🔄 Actualizar datos de un usuario por ID
 * @route PUT /api/usuarios/:id
 * REQUIERE: Middleware de autenticación (solo admin o el propio usuario)
 */
exports.updateUsuario = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nombre, email, password, rol, estado } = req.body;
        let updateSql = 'UPDATE usuarios SET nombre = ?, email = ?, rol = ?, estado = ? WHERE id = ?';
        let params = [nombre, email, rol, estado, id];

        // ⚠️ Si se proporciona una nueva contraseña, la hasheamos
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateSql = 'UPDATE usuarios SET nombre = ?, email = ?, password = ?, rol = ?, estado = ? WHERE id = ?';
            params = [nombre, email, hashedPassword, rol, estado, id];
        }

        const [result] = await pool.query(updateSql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario actualizado correctamente' });
    } catch (err) {
        next(err);
    }
};

/**
 * 🗑️ Eliminar un usuario por ID
 * @route DELETE /api/usuarios/:id
 * REQUIERE: Middleware de autenticación (solo admin)
 */
exports.deleteUsuario = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Se recomienda hacer un borrado lógico (cambiar estado a "INACTIVO") 
        // en lugar de DELETE FROM para mantener la integridad de los datos (facturas, etc.)
        const [result] = await pool.query('UPDATE usuarios SET estado = "INACTIVO" WHERE id = ?', [id]);
        
        // Si quieres un borrado físico, usa:
        // const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario marcado como inactivo (borrado lógico) correctamente' });
    } catch (err) {
        next(err);
    }
};