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
