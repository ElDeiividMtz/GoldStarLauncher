/**
 * Series UI Script
 *
 * Script de interfaz para la pantalla de activación de series.
 * Gestiona la entrada de claves, validación, activación/desactivación
 * y la navegación posterior (login o landing).
 */

const SeriesManager = require('./assets/js/seriesManager')

// Referencias a elementos del DOM
const seriesKeyInput = document.getElementById('seriesKeyInput')
const seriesActivateBtn = document.getElementById('seriesActivateBtn')
const seriesSkipBtn = document.getElementById('seriesSkipBtn')
const seriesError = document.getElementById('seriesError')
const seriesActiveInfo = document.getElementById('seriesActiveInfo')
const seriesActiveName = document.getElementById('seriesActiveName')
const seriesActiveStreamer = document.getElementById('seriesActiveStreamer')
const seriesChangeBtn = document.getElementById('seriesChangeBtn')
const seriesInputContainer = document.getElementById('seriesInputContainer')

/**
 * Comprueba si hay una serie activa y actualiza la UI en consecuencia.
 * Si hay serie activa muestra la info, si no muestra el campo de entrada.
 */
function checkActiveSeries() {
    const active = SeriesManager.getActive()

    if (active.series) {
        seriesInputContainer.style.display = 'none'
        seriesActiveInfo.style.display = 'block'
        seriesActiveName.textContent = active.series.name || 'Serie activa'
        seriesActiveStreamer.textContent = active.series.streamer
            ? `por ${active.series.streamer}`
            : ''
    } else {
        seriesInputContainer.style.display = 'block'
        seriesActiveInfo.style.display = 'none'
    }
}

/**
 * Muestra un mensaje de error en la pantalla de series.
 *
 * @param {string} message - Texto del error a mostrar.
 */
function showSeriesError(message) {
    seriesError.textContent = message
    seriesError.style.display = 'block'
}

/**
 * Navega desde la pantalla de series hacia la siguiente vista.
 * Si el usuario ya tiene cuenta, va al landing. Si no, va al login.
 */
function proceedFromSeries() {
    if (Object.keys(ConfigManager.getAuthAccounts()).length > 0) {
        switchView(VIEWS.series, VIEWS.landing)
    } else {
        loginOptionsCancelEnabled(false)
        loginOptionsViewOnLoginSuccess = VIEWS.landing
        loginOptionsViewOnLoginCancel = VIEWS.series
        switchView(VIEWS.series, VIEWS.loginOptions)
    }
}

// Evento: clic en botón "Activar"
seriesActivateBtn.addEventListener('click', async () => {
    const key = seriesKeyInput.value.trim()

    if (!key) {
        return void showSeriesError('Ingresa una clave de serie')
    }

    // Deshabilitar botón mientras se valida
    seriesActivateBtn.disabled = true
    seriesActivateBtn.querySelector('div').textContent = 'Validando...'

    const result = await SeriesManager.activate(key)

    // Restaurar botón
    seriesActivateBtn.disabled = false
    seriesActivateBtn.querySelector('div').textContent = 'Activar'

    if (result.success) {
        seriesError.style.display = 'none'
        checkActiveSeries()

        // Esperar brevemente antes de navegar
        setTimeout(() => {
            proceedFromSeries()
        }, 500)
    } else {
        showSeriesError(result.error || 'Clave no válida')

        // Animación de error
        seriesKeyInput.classList.add('shake')
        setTimeout(() => seriesKeyInput.classList.remove('shake'), 500)
    }
})

// Evento: tecla Enter en el campo de entrada
seriesKeyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        seriesActivateBtn.click()
    }
    seriesError.style.display = 'none'
})

// Evento: clic en botón "Saltar"
seriesSkipBtn.addEventListener('click', () => {
    SeriesManager.deactivate()
    proceedFromSeries()
})

// Evento: clic en botón "Cambiar serie"
seriesChangeBtn.addEventListener('click', () => {
    SeriesManager.deactivate()
    seriesKeyInput.value = ''
    checkActiveSeries()
})

// Verificar estado inicial al cargar
checkActiveSeries()
