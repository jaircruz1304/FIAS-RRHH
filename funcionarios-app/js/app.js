// Aplicación principal
class FuncionariosApp {
    constructor() {
        this.ui = uiHandler;
        this.api = apiService;
    }

    // Inicializar aplicación
    init() {
        console.log('Iniciando aplicación de gestión de funcionarios...');
        
        // Inicializar UI
        this.ui.init();
        
        // Configurar para GitHub Pages
        this.setupGitHubPages();
        
        // Mostrar mensaje de bienvenida
        this.showWelcomeMessage();
    }

    // Configurar para GitHub Pages
    setupGitHubPages() {
        if (CONFIG.IS_GITHUB_PAGES) {
            // Activar modo demo automáticamente
            CONFIG.DEMO_MODE = true;
            this.api.demoMode = true;
            this.ui.updateConnectionStatus();
            
            // Mostrar alerta informativa
            setTimeout(() => {
                this.ui.showToast(
                    'info',
                    'Modo Demo Activado',
                    'Estás en GitHub Pages. Para usar la base de datos real, configura un backend.'
                );
            }, 2000);
        }
    }

    // Mostrar mensaje de bienvenida
    showWelcomeMessage() {
        setTimeout(() => {
            const isFirstVisit = !localStorage.getItem('app_visited');
            if (isFirstVisit) {
                this.ui.showToast(
                    'info',
                    '¡Bienvenido!',
                    'Esta es una aplicación web para gestión de funcionarios con PostgreSQL'
                );
                localStorage.setItem('app_visited', 'true');
            }
        }, 1000);
    }

    // Métodos globales
    refreshData() {
        this.ui.loadSection(this.ui.currentSection);
    }

    exportToCSV(data, filename) {
        if (!data || data.length === 0) {
            this.ui.showToast('warning', 'Sin datos', 'No hay datos para exportar');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const app = new FuncionariosApp();
    app.init();
    
    // Hacer disponible globalmente para debug
    window.app = app;
    window.uiHandler = uiHandler;
    window.apiService = apiService;
});
