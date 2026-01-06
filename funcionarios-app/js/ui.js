// Clase para manejar la interfaz de usuario
class UIHandler {
    constructor() {
        this.api = apiService;
        this.currentSection = 'dashboard';
    }

    // Inicializar la interfaz
    init() {
        this.bindEvents();
        this.loadDashboard();
        this.updateConnectionStatus();
    }

    // Vincular eventos
    bindEvents() {
        // Navegación
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('[data-section]').dataset.section;
                this.loadSection(section);
            });
        });

        // Botón de conexión
        document.getElementById('btnConnection').addEventListener('click', () => {
            this.showConnectionModal();
        });

        // Botón de prueba de conexión
        document.getElementById('btnTestConnection').addEventListener('click', () => {
            this.testConnection();
        });

        // Botón de inicio rápido
        document.getElementById('btnQuickStart').addEventListener('click', () => {
            this.loadSection('funcionarios');
        });

        // Cambiar URL de API
        document.getElementById('apiUrl').addEventListener('change', (e) => {
            CONFIG.API_URL = e.target.value;
            CONFIG.saveConfig();
            this.api.baseUrl = CONFIG.API_URL;
            this.updateConnectionStatus();
        });
    }

    // Cargar sección específica
    async loadSection(section) {
        this.currentSection = section;
        
        // Actualizar navegación activa
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        
        // Mostrar loading
        this.showLoading();
        
        try {
            let content = '';
            
            switch (section) {
                case 'dashboard':
                    content = await this.loadDashboard();
                    break;
                case 'funcionarios':
                    content = await this.loadFuncionarios();
                    break;
                case 'asistencia':
                    content = await this.loadAsistencia();
                    break;
                case 'vacaciones':
                    content = await this.loadVacaciones();
                    break;
                case 'cargos':
                    content = await this.loadCargos();
                    break;
                case 'proyectos':
                    content = await this.loadProyectos();
                    break;
                case 'ciudades':
                    content = await this.loadCiudades();
                    break;
                case 'marcaciones':
                    content = await this.loadMarcacionesForm();
                    break;
                case 'reportes':
                    content = await this.loadReportes();
                    break;
                default:
                    content = '<div class="alert alert-info">Sección en desarrollo</div>';
            }
            
            document.getElementById('contentArea').innerHTML = content;
            this.bindSectionEvents();
            
        } catch (error) {
            this.showError('Error al cargar la sección', error);
        } finally {
            this.hideLoading();
        }
    }

    // Cargar dashboard
    async loadDashboard() {
        try {
            const [funcionarios, cargos, proyectos] = await Promise.all([
                this.api.getFuncionarios(),
                this.api.getCargos(),
                this.api.getProyectos()
            ]);
            
            return `
                <div class="dashboard">
                    <h2 class="mb-4">Dashboard de Gestión</h2>
                    
                    <!-- Cards de resumen -->
                    <div class="row">
                        <div class="col-md-3 mb-4">
                            <div class="card bg-primary text-white">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 class="card-title">Funcionarios Activos</h6>
                                            <h2 class="mb-0">${Array.isArray(funcionarios) ? funcionarios.filter(f => f.estado === 'ACTIVO').length : '0'}</h2>
                                        </div>
                                        <i class="fas fa-users fa-3x opacity-50"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 mb-4">
                            <div class="card bg-success text-white">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 class="card-title">Total Cargos</h6>
                                            <h2 class="mb-0">${Array.isArray(cargos) ? cargos.length : '0'}</h2>
                                        </div>
                                        <i class="fas fa-briefcase fa-3x opacity-50"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 mb-4">
                            <div class="card bg-warning text-white">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 class="card-title">Proyectos Activos</h6>
                                            <h2 class="mb-0">${Array.isArray(proyectos) ? proyectos.filter(p => p.estado === 'ACTIVO').length : '0'}</h2>
                                        </div>
                                        <i class="fas fa-project-diagram fa-3x opacity-50"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 mb-4">
                            <div class="card bg-info text-white">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 class="card-title">Marcaciones Hoy</h6>
                                            <h2 class="mb-0">0</h2>
                                        </div>
                                        <i class="fas fa-clock fa-3x opacity-50"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Acciones rápidas -->
                    <div class="row mt-4">
                        <div class="col-12">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="card-title mb-0">Acciones Rápidas</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-3 mb-3">
                                            <button class="btn btn-outline-primary w-100 action-btn" data-section="funcionarios">
                                                <i class="fas fa-user-plus fa-2x mb-2"></i><br>
                                                Nuevo Funcionario
                                            </button>
                                        </div>
                                        <div class="col-md-3 mb-3">
                                            <button class="btn btn-outline-success w-100 action-btn" data-section="marcaciones">
                                                <i class="fas fa-clock fa-2x mb-2"></i><br>
                                                Registrar Asistencia
                                            </button>
                                        </div>
                                        <div class="col-md-3 mb-3">
                                            <button class="btn btn-outline-warning w-100 action-btn" data-section="vacaciones">
                                                <i class="fas fa-umbrella-beach fa-2x mb-2"></i><br>
                                                Solicitar Vacaciones
                                            </button>
                                        </div>
                                        <div class="col-md-3 mb-3">
                                            <button class="btn btn-outline-info w-100 action-btn" data-section="reportes">
                                                <i class="fas fa-chart-bar fa-2x mb-2"></i><br>
                                                Ver Reportes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Últimos funcionarios -->
                    <div class="row mt-4">
                        <div class="col-12">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="card-title mb-0">Últimos Funcionarios Registrados</h5>
                                </div>
                                <div class="card-body">
                                    <div class="table-responsive">
                                        <table class="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Código</th>
                                                    <th>Nombre</th>
                                                    <th>Cargo</th>
                                                    <th>Proyecto</th>
                                                    <th>Estado</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody id="recentFuncionarios">
                                                ${Array.isArray(funcionarios) ? 
                                                    funcionarios.slice(0, 5).map(f => `
                                                        <tr>
                                                            <td>${f.codigo_unico}</td>
                                                            <td>${f.nombres} ${f.apellidos}</td>
                                                            <td>${this.getCargoName(cargos, f.cargo_id)}</td>
                                                            <td>${this.getProyectoName(proyectos, f.proyecto_id)}</td>
                                                            <td><span class="badge bg-${f.estado === 'ACTIVO' ? 'success' : 'danger'}">${f.estado}</span></td>
                                                            <td>
                                                                <button class="btn btn-sm btn-outline-primary" onclick="uiHandler.viewFuncionario(${f.funcionario_id})">
                                                                    <i class="fas fa-eye"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    `).join('') : '<tr><td colspan="6" class="text-center">No hay datos</td></tr>'
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            return this.getErrorTemplate('Error al cargar el dashboard', error);
        }
    }

    // Cargar lista de funcionarios
    async loadFuncionarios() {
        try {
            const [funcionarios, cargos, proyectos] = await Promise.all([
                this.api.getFuncionarios(),
                this.api.getCargos(),
                this.api.getProyectos()
            ]);
            
            return `
                <div class="funcionarios-section">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2>Gestión de Funcionarios</h2>
                        <button class="btn btn-primary" id="btnNewFuncionario">
                            <i class="fas fa-plus me-2"></i>Nuevo Funcionario
                        </button>
                    </div>
                    
                    <!-- Filtros -->
                    <div class="card mb-4">
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-md-4">
                                    <input type="text" class="form-control" placeholder="Buscar por nombre..." id="searchFuncionario">
                                </div>
                                <div class="col-md-3">
                                    <select class="form-select" id="filterEstado">
                                        <option value="">Todos los estados</option>
                                        <option value="ACTIVO">Activo</option>
                                        <option value="INACTIVO">Inactivo</option>
                                        <option value="VACACIONES">Vacaciones</option>
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <select class="form-select" id="filterProyecto">
                                        <option value="">Todos los proyectos</option>
                                        ${Array.isArray(proyectos) ? proyectos.map(p => 
                                            `<option value="${p.proyecto_id}">${p.nombre_proyecto}</option>`
                                        ).join('') : ''}
                                    </select>
                                </div>
                                <div class="col-md-2">
                                    <button class="btn btn-outline-secondary w-100" id="btnFilter">
                                        <i class="fas fa-filter"></i> Filtrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Tabla de funcionarios -->
                    <div class="card">
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Código</th>
                                            <th>Identificación</th>
                                            <th>Nombre Completo</th>
                                            <th>Cargo</th>
                                            <th>Proyecto</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="funcionariosTable">
                                        ${Array.isArray(funcionarios) ? funcionarios.map(f => `
                                            <tr>
                                                <td>${f.codigo_unico}</td>
                                                <td>${f.numero_identificacion}</td>
                                                <td>${f.apellidos} ${f.nombres}</td>
                                                <td>${this.getCargoName(cargos, f.cargo_id)}</td>
                                                <td>${this.getProyectoName(proyectos, f.proyecto_id)}</td>
                                                <td>
                                                    <span class="badge bg-${this.getEstadoBadge(f.estado)}">
                                                        ${f.estado}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button class="btn btn-sm btn-outline-primary me-1" onclick="uiHandler.viewFuncionario(${f.funcionario_id})">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                    <button class="btn btn-sm btn-outline-warning me-1" onclick="uiHandler.editFuncionario(${f.funcionario_id})">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-sm btn-outline-danger" onclick="uiHandler.deleteFuncionario(${f.funcionario_id})">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('') : '<tr><td colspan="7" class="text-center">No hay funcionarios registrados</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            return this.getErrorTemplate('Error al cargar funcionarios', error);
        }
    }

    // Cargar formulario de funcionario
    async loadFuncionarioForm(funcionarioId = null) {
        try {
            const [cargos, proyectos, ciudades] = await Promise.all([
                this.api.getCargos(),
                this.api.getProyectos(),
                this.api.getCiudades()
            ]);
            
            let funcionario = null;
            if (funcionarioId) {
                funcionario = await this.api.getFuncionario(funcionarioId);
            }
            
            return `
                <div class="funcionario-form">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2>${funcionarioId ? 'Editar' : 'Nuevo'} Funcionario</h2>
                        <button class="btn btn-outline-secondary" onclick="uiHandler.loadSection('funcionarios')">
                            <i class="fas fa-arrow-left me-2"></i>Volver
                        </button>
                    </div>
                    
                    <div class="card">
                        <div class="card-body">
                            <form id="funcionarioForm">
                                <input type="hidden" id="funcionario_id" value="${funcionarioId || ''}">
                                
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Código Único *</label>
                                        <input type="text" class="form-control" id="codigo_unico" 
                                               value="${funcionario?.codigo_unico || ''}" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Tipo Identificación *</label>
                                        <select class="form-select" id="tipo_identificacion" required>
                                            <option value="CEDULA" ${funcionario?.tipo_identificacion === 'CEDULA' ? 'selected' : ''}>Cédula</option>
                                            <option value="PASAPORTE" ${funcionario?.tipo_identificacion === 'PASAPORTE' ? 'selected' : ''}>Pasaporte</option>
                                            <option value="RUC" ${funcionario?.tipo_identificacion === 'RUC' ? 'selected' : ''}>RUC</option>
                                            <option value="OTRO" ${funcionario?.tipo_identificacion === 'OTRO' ? 'selected' : ''}>Otro</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Número Identificación *</label>
                                        <input type="text" class="form-control" id="numero_identificacion" 
                                               value="${funcionario?.numero_identificacion || ''}" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Apellidos *</label>
                                        <input type="text" class="form-control" id="apellidos" 
                                               value="${funcionario?.apellidos || ''}" required>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Nombres *</label>
                                        <input type="text" class="form-control" id="nombres" 
                                               value="${funcionario?.nombres || ''}" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Correo Electrónico *</label>
                                        <input type="email" class="form-control" id="correo" 
                                               value="${funcionario?.correo || ''}" required>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Fecha de Ingreso *</label>
                                        <input type="date" class="form-control" id="fecha_ingreso" 
                                               value="${funcionario?.fecha_ingreso || new Date().toISOString().split('T')[0]}" required>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Cargo *</label>
                                        <select class="form-select" id="cargo_id" required>
                                            <option value="">Seleccionar cargo...</option>
                                            ${Array.isArray(cargos) ? cargos.map(c => `
                                                <option value="${c.cargo_id}" ${funcionario?.cargo_id === c.cargo_id ? 'selected' : ''}>
                                                    ${c.nombre_cargo}
                                                </option>
                                            `).join('') : ''}
                                        </select>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Proyecto *</label>
                                        <select class="form-select" id="proyecto_id" required>
                                            <option value="">Seleccionar proyecto...</option>
                                            ${Array.isArray(proyectos) ? proyectos.filter(p => p.estado === 'ACTIVO').map(p => `
                                                <option value="${p.proyecto_id}" ${funcionario?.proyecto_id === p.proyecto_id ? 'selected' : ''}>
                                                    ${p.nombre_proyecto}
                                                </option>
                                            `).join('') : ''}
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Ciudad *</label>
                                        <select class="form-select" id="ciudad_id" required>
                                            <option value="">Seleccionar ciudad...</option>
                                            ${Array.isArray(ciudades) ? ciudades.map(ci => `
                                                <option value="${ci.ciudad_id}" ${funcionario?.ciudad_id === ci.ciudad_id ? 'selected' : ''}>
                                                    ${ci.nombre_ciudad}
                                                </option>
                                            `).join('') : ''}
                                        </select>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Teléfono</label>
                                        <input type="text" class="form-control" id="telefono" 
                                               value="${funcionario?.telefono || ''}">
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Estado</label>
                                        <select class="form-select" id="estado">
                                            <option value="ACTIVO" ${funcionario?.estado === 'ACTIVO' ? 'selected' : ''}>Activo</option>
                                            <option value="INACTIVO" ${funcionario?.estado === 'INACTIVO' ? 'selected' : ''}>Inactivo</option>
                                            <option value="VACACIONES" ${funcionario?.estado === 'VACACIONES' ? 'selected' : ''}>Vacaciones</option>
                                            <option value="LICENCIA" ${funcionario?.estado === 'LICENCIA' ? 'selected' : ''}>Licencia</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="mt-4">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="fas fa-save me-2"></i>Guardar Funcionario
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary ms-2" onclick="uiHandler.loadSection('funcionarios')">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            return this.getErrorTemplate('Error al cargar formulario', error);
        }
    }

    // Métodos auxiliares
    getEstadoBadge(estado) {
        switch (estado) {
            case 'ACTIVO': return 'success';
            case 'INACTIVO': return 'danger';
            case 'VACACIONES': return 'warning';
            case 'LICENCIA': return 'info';
            default: return 'secondary';
        }
    }

    getCargoName(cargos, cargoId) {
        if (!Array.isArray(cargos)) return 'N/A';
        const cargo = cargos.find(c => c.cargo_id === cargoId);
        return cargo ? cargo.nombre_cargo : 'N/A';
    }

    getProyectoName(proyectos, proyectoId) {
        if (!Array.isArray(proyectos)) return 'N/A';
        const proyecto = proyectos.find(p => p.proyecto_id === proyectoId);
        return proyecto ? proyecto.nombre_proyecto : 'N/A';
    }

    getErrorTemplate(title, error) {
        return `
            <div class="alert alert-danger">
                <h4>${title}</h4>
                <p>${error.message || 'Error desconocido'}</p>
                <button class="btn btn-sm btn-outline-danger mt-2" onclick="location.reload()">
                    <i class="fas fa-redo me-1"></i>Reintentar
                </button>
            </div>
        `;
    }

    // Mostrar modal de conexión
    showConnectionModal() {
        const modal = new bootstrap.Modal(document.getElementById('dbConnectionModal'));
        modal.show();
    }

    // Probar conexión
    async testConnection() {
        this.showLoading();
        try {
            const result = await this.api.testConnection();
            this.showToast(
                result.success ? 'success' : 'error',
                result.success ? 'Conexión Exitosa' : 'Error de Conexión',
                result.message
            );
            this.updateConnectionStatus();
        } catch (error) {
            this.showError('Error al probar conexión', error);
        } finally {
            this.hideLoading();
        }
    }

    // Actualizar estado de conexión
    updateConnectionStatus() {
        const statusElement = document.getElementById('connectionStatus');
        if (CONFIG.DEMO_MODE) {
            statusElement.innerHTML = '<i class="fas fa-desktop me-1"></i> Modo Demo';
            statusElement.parentElement.classList.add('btn-warning');
        } else {
            statusElement.innerHTML = '<i class="fas fa-database me-1"></i> Conectado';
            statusElement.parentElement.classList.add('btn-success');
        }
    }

    // Mostrar/Ocultar loading
    showLoading() {
        document.getElementById('loadingSpinner').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingSpinner').style.display = 'none';
    }

    // Mostrar toast
    showToast(type, title, message) {
        const toastEl = document.getElementById('toastNotification');
        const toast = new bootstrap.Toast(toastEl);
        
        // Configurar colores según tipo
        const colors = {
            success: 'bg-success text-white',
            error: 'bg-danger text-white',
            warning: 'bg-warning',
            info: 'bg-info text-white'
        };
        
        const header = toastEl.querySelector('.toast-header');
        header.className = `toast-header ${colors[type] || colors.info}`;
        
        document.getElementById('toastTitle').textContent = title;
        document.getElementById('toastMessage').textContent = message;
        
        toast.show();
    }

    // Mostrar error
    showError(title, error) {
        console.error(title, error);
        this.showToast('error', title, error.message || 'Error desconocido');
    }

    // Vincular eventos de sección
    bindSectionEvents() {
        // Eventos específicos de cada sección
        switch (this.currentSection) {
            case 'funcionarios':
                this.bindFuncionariosEvents();
                break;
            case 'dashboard':
                this.bindDashboardEvents();
                break;
        }
    }

    bindFuncionariosEvents() {
        // Botón nuevo funcionario
        const btnNew = document.getElementById('btnNewFuncionario');
        if (btnNew) {
            btnNew.addEventListener('click', async () => {
                const form = await this.loadFuncionarioForm();
                document.getElementById('contentArea').innerHTML = form;
                this.bindFormEvents();
            });
        }
    }

    bindDashboardEvents() {
        // Botones de acción rápida
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.closest('.action-btn').dataset.section;
                this.loadSection(section);
            });
        });
    }

    bindFormEvents() {
        const form = document.getElementById('funcionarioForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveFuncionario();
            });
        }
    }

    // Métodos CRUD para funcionarios
    async saveFuncionario() {
        this.showLoading();
        try {
            const formData = {
                codigo_unico: document.getElementById('codigo_unico').value,
                tipo_identificacion: document.getElementById('tipo_identificacion').value,
                numero_identificacion: document.getElementById('numero_identificacion').value,
                apellidos: document.getElementById('apellidos').value,
                nombres: document.getElementById('nombres').value,
                correo: document.getElementById('correo').value,
                fecha_ingreso: document.getElementById('fecha_ingreso').value,
                cargo_id: parseInt(document.getElementById('cargo_id').value),
                proyecto_id: parseInt(document.getElementById('proyecto_id').value),
                ciudad_id: parseInt(document.getElementById('ciudad_id').value),
                telefono: document.getElementById('telefono').value,
                estado: document.getElementById('estado').value
            };
            
            const funcionarioId = document.getElementById('funcionario_id').value;
            let result;
            
            if (funcionarioId) {
                result = await this.api.updateFuncionario(funcionarioId, formData);
                this.showToast('success', 'Actualizado', 'Funcionario actualizado exitosamente');
            } else {
                result = await this.api.createFuncionario(formData);
                this.showToast('success', 'Creado', 'Funcionario creado exitosamente');
            }
            
            // Volver a la lista después de guardar
            setTimeout(() => {
                this.loadSection('funcionarios');
            }, 1500);
            
        } catch (error) {
            this.showError('Error al guardar funcionario', error);
        } finally {
            this.hideLoading();
        }
    }

    async viewFuncionario(id) {
        this.showLoading();
        try {
            const funcionario = await this.api.getFuncionario(id);
            const [cargos, proyectos, ciudades] = await Promise.all([
                this.api.getCargos(),
                this.api.getProyectos(),
                this.api.getCiudades()
            ]);
            
            const content = `
                <div class="funcionario-view">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2>Detalle del Funcionario</h2>
                        <button class="btn btn-outline-secondary" onclick="uiHandler.loadSection('funcionarios')">
                            <i class="fas fa-arrow-left me-2"></i>Volver
                        </button>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Información Personal</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-3">
                                    <strong>Código:</strong><br>
                                    ${funcionario.codigo_unico}
                                </div>
                                <div class="col-md-3">
                                    <strong>Identificación:</strong><br>
                                    ${funcionario.numero_identificacion}
                                </div>
                                <div class="col-md-6">
                                    <strong>Nombre Completo:</strong><br>
                                    ${funcionario.apellidos} ${funcionario.nombres}
                                </div>
                            </div>
                            <hr>
                            <div class="row">
                                <div class="col-md-4">
                                    <strong>Correo:</strong><br>
                                    ${funcionario.correo}
                                </div>
                                <div class="col-md-4">
                                    <strong>Teléfono:</strong><br>
                                    ${funcionario.telefono || 'N/A'}
                                </div>
                                <div class="col-md-4">
                                    <strong>Estado:</strong><br>
                                    <span class="badge bg-${this.getEstadoBadge(funcionario.estado)}">
                                        ${funcionario.estado}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card mt-3">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Información Laboral</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <strong>Cargo:</strong><br>
                                    ${this.getCargoName(cargos, funcionario.cargo_id)}
                                </div>
                                <div class="col-md-4">
                                    <strong>Proyecto:</strong><br>
                                    ${this.getProyectoName(proyectos, funcionario.proyecto_id)}
                                </div>
                                <div class="col-md-4">
                                    <strong>Fecha Ingreso:</strong><br>
                                    ${new Date(funcionario.fecha_ingreso).toLocaleDateString()}
                                </div>
                            </div>
                            <hr>
                            <div class="row">
                                <div class="col-md-4">
                                    <strong>Ciudad:</strong><br>
                                    ${ciudades.find(c => c.ciudad_id === funcionario.ciudad_id)?.nombre_ciudad || 'N/A'}
                                </div>
                                <div class="col-md-4">
                                    <strong>Tipo Contrato:</strong><br>
                                    ${funcionario.tipo_contrato || 'N/A'}
                                </div>
                                <div class="col-md-4">
                                    <strong>Jornada:</strong><br>
                                    ${funcionario.jornada || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <button class="btn btn-warning" onclick="uiHandler.editFuncionario(${funcionario.funcionario_id})">
                            <i class="fas fa-edit me-2"></i>Editar Funcionario
                        </button>
                    </div>
                </div>
            `;
            
            document.getElementById('contentArea').innerHTML = content;
        } catch (error) {
            this.showError('Error al cargar funcionario', error);
        } finally {
            this.hideLoading();
        }
    }

    async editFuncionario(id) {
        const form = await this.loadFuncionarioForm(id);
        document.getElementById('contentArea').innerHTML = form;
        this.bindFormEvents();
    }

    async deleteFuncionario(id) {
        if (!confirm('¿Está seguro de eliminar este funcionario?')) return;
        
        this.showLoading();
        try {
            await this.api.deleteFuncionario(id);
            this.showToast('success', 'Eliminado', 'Funcionario eliminado exitosamente');
            this.loadSection('funcionarios');
        } catch (error) {
            this.showError('Error al eliminar funcionario', error);
        } finally {
            this.hideLoading();
        }
    }

    // Otros métodos de carga (simplificados por espacio)
    async loadAsistencia() {
        return `
            <div class="asistencia-section">
                <h2 class="mb-4">Control de Asistencia</h2>
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Sección de asistencia - En desarrollo
                </div>
            </div>
        `;
    }

    async loadVacaciones() {
        return `
            <div class="vacaciones-section">
                <h2 class="mb-4">Gestión de Vacaciones</h2>
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Sección de vacaciones - En desarrollo
                </div>
            </div>
        `;
    }

    async loadCargos() {
        return `
            <div class="cargos-section">
                <h2 class="mb-4">Gestión de Cargos</h2>
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Sección de cargos - En desarrollo
                </div>
            </div>
        `;
    }

    async loadProyectos() {
        return `
            <div class="proyectos-section">
                <h2 class="mb-4">Gestión de Proyectos</h2>
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Sección de proyectos - En desarrollo
                </div>
            </div>
        `;
    }

    async loadCiudades() {
        return `
            <div class="ciudades-section">
                <h2 class="mb-4">Gestión de Ciudades</h2>
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Sección de ciudades - En desarrollo
                </div>
            </div>
        `;
    }

    async loadMarcacionesForm() {
        return `
            <div class="marcaciones-section">
                <h2 class="mb-4">Registrar Marcación</h2>
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Sección de marcaciones - En desarrollo
                </div>
            </div>
        `;
    }

    async loadReportes() {
        return `
            <div class="reportes-section">
                <h2 class="mb-4">Reportes y Estadísticas</h2>
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Sección de reportes - En desarrollo
                </div>
            </div>
        `;
    }
}

// Instancia global del manejador de UI
const uiHandler = new UIHandler();
