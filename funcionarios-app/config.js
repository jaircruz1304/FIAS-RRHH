// Configuración de la aplicación
const CONFIG = {
    // URL del backend API (cambiar según tu implementación)
    API_URL: localStorage.getItem('api_url') || 'https://funcionarios-api.onrender.com/api',
    
    // Configuración para GitHub Pages
    IS_GITHUB_PAGES: window.location.hostname.includes('github.io'),
    
    // Modo demo (para GitHub Pages)
    DEMO_MODE: true,
    
    // Datos de ejemplo para modo demo
    DEMO_DATA: {
        funcionarios: [],
        cargos: [],
        proyectos: [],
        ciudades: [],
        marcaciones: [],
        vacaciones: []
    },
    
    // Inicializar datos de ejemplo
    initDemoData: function() {
        if (this.DEMO_MODE) {
            this.DEMO_DATA = {
                cargos: [
                    { cargo_id: 1, codigo_cargo: 'ADM-001', nombre_cargo: 'Director General', nivel: 1, salario_base: 5000 },
                    { cargo_id: 2, codigo_cargo: 'ADM-002', nombre_cargo: 'Gerente', nivel: 2, salario_base: 3500 },
                    { cargo_id: 3, codigo_cargo: 'ADM-003', nombre_cargo: 'Coordinador', nivel: 3, salario_base: 2500 }
                ],
                proyectos: [
                    { proyecto_id: 1, codigo_proyecto: 'PROY-2024-001', nombre_proyecto: 'Digitalización Institucional', estado: 'ACTIVO' },
                    { proyecto_id: 2, codigo_proyecto: 'PROY-2024-002', nombre_proyecto: 'Implementación ERP', estado: 'ACTIVO' }
                ],
                ciudades: [
                    { ciudad_id: 1, nombre_ciudad: 'Quito', provincia: 'Pichincha', pais: 'Ecuador' },
                    { ciudad_id: 2, nombre_ciudad: 'Guayaquil', provincia: 'Guayas', pais: 'Ecuador' }
                ],
                funcionarios: [],
                marcaciones: [],
                vacaciones: []
            };
            
            // Generar algunos funcionarios de ejemplo
            for (let i = 1; i <= 10; i++) {
                this.DEMO_DATA.funcionarios.push({
                    funcionario_id: i,
                    codigo_unico: `FUNC-${i.toString().padStart(4, '0')}`,
                    tipo_identificacion: 'CEDULA',
                    numero_identificacion: `170000000${i}`,
                    apellidos: `Apellido${i}`,
                    nombres: `Nombre${i}`,
                    fecha_ingreso: '2024-01-15',
                    cargo_id: (i % 3) + 1,
                    proyecto_id: (i % 2) + 1,
                    estado: 'ACTIVO',
                    correo: `funcionario${i}@empresa.com`,
                    ciudad_id: (i % 2) + 1,
                    telefono: `099999999${i}`
                });
            }
        }
    },
    
    // Guardar configuración en localStorage
    saveConfig: function() {
        localStorage.setItem('api_url', this.API_URL);
        localStorage.setItem('demo_mode', this.DEMO_MODE.toString());
    },
    
    // Cargar configuración desde localStorage
    loadConfig: function() {
        const savedUrl = localStorage.getItem('api_url');
        if (savedUrl) this.API_URL = savedUrl;
        
        const demoMode = localStorage.getItem('demo_mode');
        if (demoMode) this.DEMO_MODE = demoMode === 'true';
        
        this.initDemoData();
    }
};

// Inicializar configuración
CONFIG.loadConfig();
