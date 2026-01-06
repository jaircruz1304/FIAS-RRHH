const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Configurar CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Configurar conexión a PostgreSQL con tus datos
const pool = new Pool({
    user: 'dbfias_user',
    host: 'dpg-d5em2lngi27c73c78kc0-a.virginia-postgres.render.com',
    database: 'dbfias',
    password: 'Narbc5QsFQcvvFfsnRc1wElzrkeJDqSV',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000
});

// Probar conexión a la base de datos
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error conectando a PostgreSQL:', err.message);
    } else {
        console.log('✅ Conectado a PostgreSQL en Render');
        console.log('📊 Base de datos: dbfias');
        console.log('👤 Usuario: dbfias_user');
        release();
    }
});

// ==================== RUTAS DE LA API ====================

// 1. Endpoint de salud
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT NOW()');
        res.json({
            status: 'OK',
            message: 'API funcionando correctamente',
            database: 'Conectado',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Error de conexión a la base de datos',
            error: error.message
        });
    }
});

// 2. Crear tablas si no existen
app.get('/api/setup-database', async (req, res) => {
    try {
        // Leer el script SQL desde un string (podrías leerlo de un archivo)
        const createTablesSQL = `
            -- Tabla de proyectos
            CREATE TABLE IF NOT EXISTS proyectos (
                proyecto_id SERIAL PRIMARY KEY,
                codigo_proyecto VARCHAR(20) UNIQUE NOT NULL,
                nombre_proyecto VARCHAR(100) NOT NULL,
                descripcion TEXT,
                presupuesto DECIMAL(15,2),
                fecha_inicio DATE,
                fecha_fin DATE,
                estado VARCHAR(20) CHECK (estado IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO')) DEFAULT 'ACTIVO',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Tabla de cargos
            CREATE TABLE IF NOT EXISTS cargos (
                cargo_id SERIAL PRIMARY KEY,
                codigo_cargo VARCHAR(20) UNIQUE NOT NULL,
                nombre_cargo VARCHAR(100) NOT NULL,
                nivel INT DEFAULT 1,
                salario_base DECIMAL(10,2),
                descripcion TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Tabla de ciudades
            CREATE TABLE IF NOT EXISTS ciudades (
                ciudad_id SERIAL PRIMARY KEY,
                nombre_ciudad VARCHAR(100) NOT NULL,
                codigo_postal VARCHAR(10),
                provincia VARCHAR(100),
                pais VARCHAR(50) DEFAULT 'Ecuador',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Tabla de funcionarios
            CREATE TABLE IF NOT EXISTS funcionarios (
                funcionario_id SERIAL PRIMARY KEY,
                codigo_unico VARCHAR(20) UNIQUE NOT NULL,
                tipo_identificacion VARCHAR(20) CHECK (tipo_identificacion IN ('CEDULA', 'PASAPORTE', 'RUC', 'OTRO')) DEFAULT 'CEDULA',
                numero_identificacion VARCHAR(20) UNIQUE NOT NULL,
                apellidos VARCHAR(100) NOT NULL,
                nombres VARCHAR(100) NOT NULL,
                fecha_nacimiento DATE,
                genero VARCHAR(10) CHECK (genero IN ('M', 'F', 'OTRO')),
                estado_civil VARCHAR(20) CHECK (estado_civil IN ('SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO', 'UNION LIBRE')),
                
                fecha_ingreso DATE NOT NULL,
                fecha_salida DATE,
                cargo_id INT,
                proyecto_id INT,
                estado VARCHAR(20) CHECK (estado IN ('ACTIVO', 'INACTIVO', 'VACACIONES', 'LICENCIA', 'SUSPENDIDO')) DEFAULT 'ACTIVO',
                correo VARCHAR(150) UNIQUE NOT NULL,
                ciudad_id INT,
                
                telefono VARCHAR(20),
                celular VARCHAR(20),
                direccion TEXT,
                foto_url VARCHAR(255),
                
                tipo_contrato VARCHAR(20) CHECK (tipo_contrato IN ('INDEFINIDO', 'TEMPORAL', 'PRACTICAS', 'CONSULTOR')) DEFAULT 'INDEFINIDO',
                jornada VARCHAR(20) CHECK (jornada IN ('TIEMPO_COMPLETO', 'MEDIO_TIEMPO', 'POR_HORAS')) DEFAULT 'TIEMPO_COMPLETO',
                supervisor_id INT,
                
                codigo_biometrico VARCHAR(50) UNIQUE,
                codigo_teams VARCHAR(50) UNIQUE,
                usuario_ad VARCHAR(50) UNIQUE,
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(50),
                updated_by VARCHAR(50)
            );

            -- Tabla de marcaciones
            CREATE TABLE IF NOT EXISTS marcaciones (
                marcacion_id SERIAL PRIMARY KEY,
                funcionario_id INT NOT NULL,
                tipo_marcacion VARCHAR(20) CHECK (tipo_marcacion IN ('ENTRADA', 'SALIDA', 'BREAK_INICIO', 'BREAK_FIN')) NOT NULL,
                fecha_hora TIMESTAMP NOT NULL,
                dispositivo VARCHAR(20) CHECK (dispositivo IN ('BIOMETRICO', 'TEAMS', 'WEB', 'MOVIL')) DEFAULT 'BIOMETRICO',
                ubicacion VARCHAR(255),
                ip_address VARCHAR(45),
                observaciones TEXT,
                sincronizado BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Insertar datos iniciales
            INSERT INTO ciudades (nombre_ciudad, provincia) VALUES
            ('Quito', 'Pichincha'),
            ('Guayaquil', 'Guayas'),
            ('Cuenca', 'Azuay'),
            ('Ambato', 'Tungurahua'),
            ('Manta', 'Manabí')
            ON CONFLICT DO NOTHING;

            INSERT INTO cargos (codigo_cargo, nombre_cargo, nivel, salario_base) VALUES
            ('ADM-001', 'Director General', 1, 5000.00),
            ('ADM-002', 'Gerente', 2, 3500.00),
            ('ADM-003', 'Coordinador', 3, 2500.00),
            ('TEC-001', 'Desarrollador Senior', 4, 3000.00),
            ('TEC-002', 'Desarrollador Junior', 5, 1500.00)
            ON CONFLICT (codigo_cargo) DO NOTHING;

            INSERT INTO proyectos (codigo_proyecto, nombre_proyecto) VALUES
            ('PROY-2024-001', 'Digitalización Institucional'),
            ('PROY-2024-002', 'Implementación ERP'),
            ('PROY-2024-003', 'Capacitación Interna')
            ON CONFLICT (codigo_proyecto) DO NOTHING;
        `;

        // Ejecutar el script
        await pool.query(createTablesSQL);
        
        res.json({
            success: true,
            message: 'Base de datos inicializada correctamente',
            tables: ['proyectos', 'cargos', 'ciudades', 'funcionarios', 'marcaciones']
        });
        
    } catch (error) {
        console.error('Error al inicializar base de datos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 3. Obtener funcionarios
app.get('/api/funcionarios', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT f.*, c.nombre_cargo, p.nombre_proyecto, ci.nombre_ciudad
            FROM funcionarios f
            LEFT JOIN cargos c ON f.cargo_id = c.cargo_id
            LEFT JOIN proyectos p ON f.proyecto_id = p.proyecto_id
            LEFT JOIN ciudades ci ON f.ciudad_id = ci.ciudad_id
            ORDER BY f.funcionario_id DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Crear funcionario
app.post('/api/funcionarios', async (req, res) => {
    try {
        const {
            codigo_unico,
            tipo_identificacion = 'CEDULA',
            numero_identificacion,
            apellidos,
            nombres,
            correo,
            fecha_ingreso,
            cargo_id,
            proyecto_id,
            ciudad_id,
            telefono,
            estado = 'ACTIVO'
        } = req.body;

        const result = await pool.query(
            `INSERT INTO funcionarios (
                codigo_unico, tipo_identificacion, numero_identificacion,
                apellidos, nombres, correo, fecha_ingreso, cargo_id,
                proyecto_id, ciudad_id, telefono, estado
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *`,
            [
                codigo_unico, tipo_identificacion, numero_identificacion,
                apellidos, nombres, correo, fecha_ingreso || new Date().toISOString().split('T')[0],
                cargo_id, proyecto_id, ciudad_id, telefono, estado
            ]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 5. Obtener cargos
app.get('/api/cargos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM cargos ORDER BY cargo_id');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. Obtener proyectos
app.get('/api/proyectos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM proyectos ORDER BY proyecto_id');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 7. Obtener ciudades
app.get('/api/ciudades', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM ciudades ORDER BY ciudad_id');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 8. Verificar estado de tablas
app.get('/api/tables-status', async (req, res) => {
    try {
        const tables = ['proyectos', 'cargos', 'ciudades', 'funcionarios', 'marcaciones'];
        const status = {};
        
        for (const table of tables) {
            try {
                const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
                status[table] = {
                    exists: true,
                    count: parseInt(result.rows[0].count)
                };
            } catch (error) {
                status[table] = {
                    exists: false,
                    error: error.message
                };
            }
        }
        
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Servir archivos estáticos para el frontend
app.use(express.static('public'));

// Ruta principal
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sistema de Funcionarios</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .container { max-width: 800px; margin: 0 auto; }
                .card { border: 1px solid #ddd; padding: 20px; margin: 10px 0; border-radius: 5px; }
                .success { background-color: #d4edda; }
                .error { background-color: #f8d7da; }
                code { background: #f4f4f4; padding: 5px; border-radius: 3px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 API de Gestión de Funcionarios</h1>
                <div class="card success">
                    <h3>✅ Backend funcionando</h3>
                    <p>Base de datos PostgreSQL conectada en Render</p>
                </div>
                
                <div class="card">
                    <h3>📊 Endpoints disponibles:</h3>
                    <ul>
                        <li><code>GET /api/health</code> - Estado del sistema</li>
                        <li><code>GET /api/setup-database</code> - Crear tablas</li>
                        <li><code>GET /api/tables-status</code> - Verificar tablas</li>
                        <li><code>GET /api/funcionarios</code> - Listar funcionarios</li>
                        <li><code>POST /api/funcionarios</code> - Crear funcionario</li>
                        <li><code>GET /api/cargos</code> - Listar cargos</li>
                        <li><code>GET /api/proyectos</code> - Listar proyectos</li>
                        <li><code>GET /api/ciudades</code> - Listar ciudades</li>
                    </ul>
                </div>
                
                <div class="card">
                    <h3>🔧 Configuración:</h3>
                    <p><strong>Base de datos:</strong> dbfias</p>
                    <p><strong>Host:</strong> dpg-d5em2lngi27c73c78kc0-a.virginia-postgres.render.com</p>
                    <p><strong>Puerto:</strong> 5432</p>
                </div>
                
                <div class="card">
                    <h3>🚀 Acciones rápidas:</h3>
                    <button onclick="setupDatabase()">Crear Tablas</button>
                    <button onclick="checkHealth()">Verificar Salud</button>
                    <button onclick="checkTables()">Verificar Tablas</button>
                    
                    <div id="result" style="margin-top: 20px;"></div>
                </div>
            </div>
            
            <script>
                async function setupDatabase() {
                    const result = document.getElementById('result');
                    result.innerHTML = '<p>⏳ Creando tablas...</p>';
                    
                    try {
                        const response = await fetch('/api/setup-database');
                        const data = await response.json();
                        result.innerHTML = `<div class="card ${data.success ? 'success' : 'error'}">
                            <p><strong>${data.success ? '✅ Éxito' : '❌ Error'}</strong></p>
                            <p>${data.message}</p>
                        </div>`;
                    } catch (error) {
                        result.innerHTML = `<div class="card error">
                            <p><strong>❌ Error</strong></p>
                            <p>${error.message}</p>
                        </div>`;
                    }
                }
                
                async function checkHealth() {
                    const result = document.getElementById('result');
                    result.innerHTML = '<p>⏳ Verificando salud...</p>';
                    
                    try {
                        const response = await fetch('/api/health');
                        const data = await response.json();
                        result.innerHTML = `<div class="card ${data.status === 'OK' ? 'success' : 'error'}">
                            <p><strong>${data.status === 'OK' ? '✅ Salud OK' : '❌ Problemas'}</strong></p>
                            <p>${data.message}</p>
                            <p>Base de datos: ${data.database}</p>
                        </div>`;
                    } catch (error) {
                        result.innerHTML = `<div class="card error">
                            <p><strong>❌ Error</strong></p>
                            <p>${error.message}</p>
                        </div>`;
                    }
                }
                
                async function checkTables() {
                    const result = document.getElementById('result');
                    result.innerHTML = '<p>⏳ Verificando tablas...</p>';
                    
                    try {
                        const response = await fetch('/api/tables-status');
                        const data = await response.json();
                        
                        let html = '<div class="card"><h4>Estado de las tablas:</h4>';
                        for (const [table, info] of Object.entries(data)) {
                            html += `<p><strong>${table}:</strong> ${info.exists ? '✅ Existe' : '❌ No existe'} (${info.count || 0} registros)</p>`;
                        }
                        html += '</div>';
                        
                        result.innerHTML = html;
                    } catch (error) {
                        result.innerHTML = `<div class="card error">
                            <p><strong>❌ Error</strong></p>
                            <p>${error.message}</p>
                        </div>`;
                    }
                }
            </script>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor funcionando en puerto ${PORT}`);
    console.log(`🔗 http://localhost:${PORT}`);
    console.log(`📊 Base de datos: dbfias`);
});
