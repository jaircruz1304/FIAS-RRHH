// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de PostgreSQL para Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necesario para Render PostgreSQL
  }
});

// Verificar conexión a la base de datos
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error conectando a PostgreSQL:', err.stack);
  } else {
    console.log('✅ Conectado a PostgreSQL en Render');
    release();
  }
});

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// ========== FUNCIONARIOS ==========
app.get('/api/funcionarios', async (req, res) => {
  try {
    const { estado, proyecto_id } = req.query;
    let query = `
      SELECT f.*, c.nombre_cargo, p.nombre_proyecto, ci.nombre_ciudad
      FROM funcionarios f
      LEFT JOIN cargos c ON f.cargo_id = c.cargo_id
      LEFT JOIN proyectos p ON f.proyecto_id = p.proyecto_id
      LEFT JOIN ciudades ci ON f.ciudad_id = ci.ciudad_id
    `;
    const params = [];
    
    if (estado || proyecto_id) {
      query += ' WHERE ';
      const conditions = [];
      
      if (estado) {
        conditions.push(`f.estado = $${params.length + 1}`);
        params.push(estado);
      }
      
      if (proyecto_id) {
        conditions.push(`f.proyecto_id = $${params.length + 1}`);
        params.push(proyecto_id);
      }
      
      query += conditions.join(' AND ');
    }
    
    query += ' ORDER BY f.funcionario_id DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener funcionarios:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/funcionarios/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.*, c.nombre_cargo, p.nombre_proyecto, ci.nombre_ciudad
       FROM funcionarios f
       LEFT JOIN cargos c ON f.cargo_id = c.cargo_id
       LEFT JOIN proyectos p ON f.proyecto_id = p.proyecto_id
       LEFT JOIN ciudades ci ON f.ciudad_id = ci.ciudad_id
       WHERE f.funcionario_id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionario no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener funcionario:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/funcionarios', async (req, res) => {
  try {
    const {
      codigo_unico,
      tipo_identificacion,
      numero_identificacion,
      apellidos,
      nombres,
      correo,
      fecha_ingreso,
      cargo_id,
      proyecto_id,
      ciudad_id,
      telefono,
      estado = 'ACTIVO',
      genero,
      estado_civil,
      fecha_nacimiento,
      direccion,
      tipo_contrato = 'INDEFINIDO',
      jornada = 'TIEMPO_COMPLETO'
    } = req.body;

    const result = await pool.query(
      `INSERT INTO funcionarios (
        codigo_unico, tipo_identificacion, numero_identificacion,
        apellidos, nombres, correo, fecha_ingreso, cargo_id,
        proyecto_id, ciudad_id, telefono, estado, genero,
        estado_civil, fecha_nacimiento, direccion, tipo_contrato, jornada
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        codigo_unico, tipo_identificacion, numero_identificacion,
        apellidos, nombres, correo, fecha_ingreso, cargo_id,
        proyecto_id, ciudad_id, telefono, estado, genero,
        estado_civil, fecha_nacimiento, direccion, tipo_contrato, jornada
      ]
    );

    // Registrar en historial
    await pool.query(
      `INSERT INTO historial_funcionarios (
        funcionario_id, campo_modificado, valor_anterior,
        valor_nuevo, usuario_cambio, tipo_cambio
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        result.rows[0].funcionario_id,
        'CREACION',
        null,
        `${codigo_unico}|${nombres} ${apellidos}`,
        'sistema',
        'CREACION'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear funcionario:', error);
    
    // Manejar errores de duplicados
    if (error.code === '23505') {
      if (error.constraint.includes('codigo_unico')) {
        return res.status(400).json({ error: 'El código único ya existe' });
      }
      if (error.constraint.includes('numero_identificacion')) {
        return res.status(400).json({ error: 'El número de identificación ya existe' });
      }
      if (error.constraint.includes('correo')) {
        return res.status(400).json({ error: 'El correo electrónico ya existe' });
      }
    }
    
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/funcionarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Obtener valores actuales
    const current = await pool.query(
      'SELECT * FROM funcionarios WHERE funcionario_id = $1',
      [id]
    );
    
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionario no encontrado' });
    }
    
    // Construir consulta dinámica
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    Object.keys(updates).forEach(key => {
      if (key !== 'funcionario_id') {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });
    
    values.push(id);
    
    const query = `
      UPDATE funcionarios 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE funcionario_id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    // Registrar en historial
    await pool.query(
      `INSERT INTO historial_funcionarios (
        funcionario_id, campo_modificado, valor_anterior,
        valor_nuevo, usuario_cambio, tipo_cambio
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        'ACTUALIZACION',
        JSON.stringify(current.rows[0]),
        JSON.stringify(result.rows[0]),
        'sistema',
        'ACTUALIZACION'
      ]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar funcionario:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/funcionarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si existe
    const current = await pool.query(
      'SELECT * FROM funcionarios WHERE funcionario_id = $1',
      [id]
    );
    
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionario no encontrado' });
    }
    
    // Cambiar estado a INACTIVO en lugar de eliminar
    const result = await pool.query(
      `UPDATE funcionarios 
       SET estado = 'INACTIVO', updated_at = CURRENT_TIMESTAMP
       WHERE funcionario_id = $1
       RETURNING *`,
      [id]
    );
    
    // Registrar en historial
    await pool.query(
      `INSERT INTO historial_funcionarios (
        funcionario_id, campo_modificado, valor_anterior,
        valor_nuevo, usuario_cambio, tipo_cambio
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        'ELIMINACION',
        JSON.stringify(current.rows[0]),
        JSON.stringify(result.rows[0]),
        'sistema',
        'ELIMINACION'
      ]
    );
    
    res.json({ message: 'Funcionario marcado como inactivo', data: result.rows[0] });
  } catch (error) {
    console.error('Error al eliminar funcionario:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== CARGOS ==========
app.get('/api/cargos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cargos ORDER BY cargo_id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener cargos:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cargos', async (req, res) => {
  try {
    const { codigo_cargo, nombre_cargo, nivel, salario_base, descripcion } = req.body;
    
    const result = await pool.query(
      `INSERT INTO cargos (codigo_cargo, nombre_cargo, nivel, salario_base, descripcion)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [codigo_cargo, nombre_cargo, nivel, salario_base, descripcion]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear cargo:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== PROYECTOS ==========
app.get('/api/proyectos', async (req, res) => {
  try {
    const { estado } = req.query;
    let query = 'SELECT * FROM proyectos';
    const params = [];
    
    if (estado) {
      query += ' WHERE estado = $1';
      params.push(estado);
    }
    
    query += ' ORDER BY proyecto_id DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/proyectos', async (req, res) => {
  try {
    const {
      codigo_proyecto,
      nombre_proyecto,
      descripcion,
      presupuesto,
      fecha_inicio,
      fecha_fin,
      estado = 'ACTIVO'
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO proyectos (
        codigo_proyecto, nombre_proyecto, descripcion,
        presupuesto, fecha_inicio, fecha_fin, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [codigo_proyecto, nombre_proyecto, descripcion,
       presupuesto, fecha_inicio, fecha_fin, estado]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== CIUDADES ==========
app.get('/api/ciudades', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ciudades ORDER BY nombre_ciudad');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener ciudades:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ciudades', async (req, res) => {
  try {
    const { nombre_ciudad, codigo_postal, provincia, pais = 'Ecuador' } = req.body;
    
    const result = await pool.query(
      `INSERT INTO ciudades (nombre_ciudad, codigo_postal, provincia, pais)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [nombre_ciudad, codigo_postal, provincia, pais]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear ciudad:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== MARCACIONES ==========
app.get('/api/marcaciones', async (req, res) => {
  try {
    const { fecha, funcionario_id } = req.query;
    let query = `
      SELECT m.*, f.codigo_unico, f.apellidos, f.nombres
      FROM marcaciones m
      JOIN funcionarios f ON m.funcionario_id = f.funcionario_id
    `;
    const params = [];
    
    if (fecha || funcionario_id) {
      query += ' WHERE ';
      const conditions = [];
      
      if (fecha) {
        conditions.push(`DATE(m.fecha_hora) = $${params.length + 1}`);
        params.push(fecha);
      }
      
      if (funcionario_id) {
        conditions.push(`m.funcionario_id = $${params.length + 1}`);
        params.push(funcionario_id);
      }
      
      query += conditions.join(' AND ');
    }
    
    query += ' ORDER BY m.fecha_hora DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener marcaciones:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/marcaciones', async (req, res) => {
  try {
    const {
      funcionario_id,
      tipo_marcacion,
      fecha_hora,
      dispositivo = 'BIOMETRICO',
      ubicacion,
      ip_address,
      observaciones
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO marcaciones (
        funcionario_id, tipo_marcacion, fecha_hora,
        dispositivo, ubicacion, ip_address, observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [funcionario_id, tipo_marcacion, fecha_hora,
       dispositivo, ubicacion, ip_address, observaciones]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear marcación:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== VACACIONES ==========
app.get('/api/vacaciones', async (req, res) => {
  try {
    const { estado, funcionario_id } = req.query;
    let query = `
      SELECT v.*, f.codigo_unico, f.apellidos, f.nombres,
             a.apellidos as aprobador_apellidos, a.nombres as aprobador_nombres
      FROM vacaciones v
      JOIN funcionarios f ON v.funcionario_id = f.funcionario_id
      LEFT JOIN funcionarios a ON v.aprobado_por = a.funcionario_id
    `;
    const params = [];
    
    if (estado || funcionario_id) {
      query += ' WHERE ';
      const conditions = [];
      
      if (estado) {
        conditions.push(`v.estado = $${params.length + 1}`);
        params.push(estado);
      }
      
      if (funcionario_id) {
        conditions.push(`v.funcionario_id = $${params.length + 1}`);
        params.push(funcionario_id);
      }
      
      query += conditions.join(' AND ');
    }
    
    query += ' ORDER BY v.fecha_inicio DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener vacaciones:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vacaciones', async (req, res) => {
  try {
    const {
      funcionario_id,
      fecha_inicio,
      fecha_fin,
      dias_totales,
      observaciones,
      estado = 'PENDIENTE'
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO vacaciones (
        funcionario_id, fecha_inicio, fecha_fin,
        dias_totales, observaciones, estado
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [funcionario_id, fecha_inicio, fecha_fin,
       dias_totales, observaciones, estado]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear vacación:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== REPORTES ==========
app.get('/api/reportes/mensual', async (req, res) => {
  try {
    const { mes, anio } = req.query;
    
    if (!mes || !anio) {
      return res.status(400).json({ error: 'Mes y año son requeridos' });
    }
    
    const result = await pool.query(
      `SELECT 
        f.codigo_unico,
        CONCAT(f.apellidos, ' ', f.nombres) as nombre_completo,
        c.nombre_cargo,
        COUNT(DISTINCT DATE(m.fecha_hora)) as dias_trabajados,
        COUNT(CASE WHEN m.tipo_marcacion = 'ENTRADA' THEN 1 END) as entradas,
        COUNT(CASE WHEN m.tipo_marcacion = 'SALIDA' THEN 1 END) as salidas
      FROM funcionarios f
      LEFT JOIN cargos c ON f.cargo_id = c.cargo_id
      LEFT JOIN marcaciones m ON f.funcionario_id = m.funcionario_id
        AND EXTRACT(MONTH FROM m.fecha_hora) = $1
        AND EXTRACT(YEAR FROM m.fecha_hora) = $2
      WHERE f.estado = 'ACTIVO'
      GROUP BY f.funcionario_id, f.codigo_unico, f.apellidos, f.nombres, c.nombre_cargo
      ORDER BY f.apellidos`,
      [mes, anio]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al generar reporte:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reportes/vacaciones', async (req, res) => {
  try {
    const { anio } = req.query;
    
    const result = await pool.query(
      `SELECT 
        p.nombre_proyecto,
        COUNT(v.vacacion_id) as total_solicitudes,
        SUM(CASE WHEN v.estado = 'APROBADO' THEN 1 ELSE 0 END) as aprobadas,
        SUM(CASE WHEN v.estado = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
        SUM(v.dias_totales) as total_dias
      FROM proyectos p
      LEFT JOIN funcionarios f ON p.proyecto_id = f.proyecto_id
      LEFT JOIN vacaciones v ON f.funcionario_id = v.funcionario_id
        AND EXTRACT(YEAR FROM v.fecha_inicio) = $1
      WHERE p.estado = 'ACTIVO'
      GROUP BY p.proyecto_id, p.nombre_proyecto
      ORDER BY p.nombre_proyecto`,
      [anio || new Date().getFullYear()]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al generar reporte de vacaciones:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== CONFIGURACIONES ==========
app.get('/api/configuraciones', async (req, res) => {
  try {
    const { categoria } = req.query;
    let query = 'SELECT * FROM configuraciones';
    const params = [];
    
    if (categoria) {
      query += ' WHERE categoria = $1';
      params.push(categoria);
    }
    
    query += ' ORDER BY categoria, clave';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener configuraciones:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== DATOS INICIALES ==========
app.post('/api/inicializar', async (req, res) => {
  try {
    // Crear tablas si no existen (esto es un ejemplo básico)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS proyectos (
        proyecto_id SERIAL PRIMARY KEY,
        codigo_proyecto VARCHAR(20) UNIQUE NOT NULL,
        nombre_proyecto VARCHAR(100) NOT NULL,
        estado VARCHAR(20) DEFAULT 'ACTIVO'
      )
    `);
    
    // Insertar datos iniciales
    await pool.query(`
      INSERT INTO proyectos (codigo_proyecto, nombre_proyecto) 
      VALUES ('PROY-2024-001', 'Digitalización Institucional')
      ON CONFLICT (codigo_proyecto) DO NOTHING
    `);
    
    res.json({ message: 'Base de datos inicializada' });
  } catch (error) {
    console.error('Error al inicializar:', error);
    res.status(500).json({ error: error.message });
  }
});

// Servir frontend estático si está en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
  });
}

const PORT = process.env.PORT || 5432;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌍 Modo: ${process.env.NODE_ENV || 'development'}`);
});
