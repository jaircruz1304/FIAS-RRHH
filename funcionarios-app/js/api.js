// Clase para manejar las peticiones a la API
class ApiService {
    constructor() {
        this.baseUrl = CONFIG.API_URL;
        this.demoMode = CONFIG.DEMO_MODE;
        this.demoData = CONFIG.DEMO_DATA;
    }

    // Método genérico para hacer peticiones
    async request(endpoint, method = 'GET', data = null) {
        // Si estamos en modo demo, usar datos locales
        if (this.demoMode && !endpoint.includes('connection')) {
            return this.handleDemoRequest(endpoint, method, data);
        }

        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error en la petición:', error);
            throw error;
        }
    }

    // Manejar peticiones en modo demo
    handleDemoRequest(endpoint, method, data) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    let result;
                    const segments = endpoint.split('/').filter(s => s);
                    
                    switch (method) {
                        case 'GET':
                            result = this.handleDemoGet(segments);
                            break;
                        case 'POST':
                            result = this.handleDemoPost(segments, data);
                            break;
                        case 'PUT':
                            result = this.handleDemoPut(segments, data);
                            break;
                        case 'DELETE':
                            result = this.handleDemoDelete(segments);
                            break;
                        default:
                            result = { error: 'Método no soportado en modo demo' };
                    }
                    
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            }, 500); // Simular latencia de red
        });
    }

    // Métodos CRUD específicos para cada entidad
    // Funcionarios
    async getFuncionarios() {
        return this.request('/funcionarios');
    }

    async getFuncionario(id) {
        return this.request(`/funcionarios/${id}`);
    }

    async createFuncionario(data) {
        return this.request('/funcionarios', 'POST', data);
    }

    async updateFuncionario(id, data) {
        return this.request(`/funcionarios/${id}`, 'PUT', data);
    }

    async deleteFuncionario(id) {
        return this.request(`/funcionarios/${id}`, 'DELETE');
    }

    // Cargos
    async getCargos() {
        return this.request('/cargos');
    }

    async createCargo(data) {
        return this.request('/cargos', 'POST', data);
    }

    // Proyectos
    async getProyectos() {
        return this.request('/proyectos');
    }

    async createProyecto(data) {
        return this.request('/proyectos', 'POST', data);
    }

    // Ciudades
    async getCiudades() {
        return this.request('/ciudades');
    }

    // Marcaciones
    async getMarcaciones(fecha = null) {
        let endpoint = '/marcaciones';
        if (fecha) {
            endpoint += `?fecha=${fecha}`;
        }
        return this.request(endpoint);
    }

    async createMarcacion(data) {
        return this.request('/marcaciones', 'POST', data);
    }

    // Vacaciones
    async getVacaciones() {
        return this.request('/vacaciones');
    }

    async createVacacion(data) {
        return this.request('/vacaciones', 'POST', data);
    }

    // Reportes
    async getReporteMensual(mes, anio) {
        return this.request(`/reportes/mensual?mes=${mes}&anio=${anio}`);
    }

    // Verificar conexión
    async testConnection() {
        try {
            const response = await this.request('/health', 'GET');
            return { success: true, message: 'Conexión exitosa' };
        } catch (error) {
            if (this.demoMode) {
                return { success: true, message: 'Modo demo activado' };
            }
            return { success: false, message: error.message };
        }
    }

    // Métodos auxiliares para modo demo
    handleDemoGet(segments) {
        const entity = segments[0];
        const id = segments[1] ? parseInt(segments[1]) : null;
        
        if (!this.demoData[entity]) {
            return { error: `Entidad ${entity} no encontrada` };
        }
        
        if (id) {
            const item = this.demoData[entity].find(item => item[`${entity.slice(0, -1)}_id`] === id);
            return item || { error: 'No encontrado' };
        }
        
        return this.demoData[entity];
    }

    handleDemoPost(segments, data) {
        const entity = segments[0];
        
        if (!this.demoData[entity]) {
            return { error: `Entidad ${entity} no encontrada` };
        }
        
        const newId = this.demoData[entity].length > 0 
            ? Math.max(...this.demoData[entity].map(item => item[`${entity.slice(0, -1)}_id`])) + 1
            : 1;
        
        const newItem = {
            ...data,
            [`${entity.slice(0, -1)}_id`]: newId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        this.demoData[entity].push(newItem);
        return { success: true, data: newItem };
    }

    handleDemoPut(segments, data) {
        const entity = segments[0];
        const id = parseInt(segments[1]);
        
        if (!this.demoData[entity]) {
            return { error: `Entidad ${entity} no encontrada` };
        }
        
        const index = this.demoData[entity].findIndex(item => item[`${entity.slice(0, -1)}_id`] === id);
        
        if (index === -1) {
            return { error: 'No encontrado' };
        }
        
        this.demoData[entity][index] = {
            ...this.demoData[entity][index],
            ...data,
            updated_at: new Date().toISOString()
        };
        
        return { success: true, data: this.demoData[entity][index] };
    }

    handleDemoDelete(segments) {
        const entity = segments[0];
        const id = parseInt(segments[1]);
        
        if (!this.demoData[entity]) {
            return { error: `Entidad ${entity} no encontrada` };
        }
        
        const index = this.demoData[entity].findIndex(item => item[`${entity.slice(0, -1)}_id`] === id);
        
        if (index === -1) {
            return { error: 'No encontrado' };
        }
        
        this.demoData[entity].splice(index, 1);
        return { success: true };
    }
}

// Instancia global del servicio API
const apiService = new ApiService();
