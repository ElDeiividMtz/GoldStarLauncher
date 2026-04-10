/**
 * SeriesManager
 *
 * Gestiona la activación, restauración y desactivación de series.
 * Una serie es una configuración especial vinculada a una clave que puede
 * cambiar el tema visual y el servidor seleccionado del launcher.
 */

const { LoggerUtil } = require('helios-core')
const ConfigManager = require('./configmanager')
const RemoteConfig = require('./remoteConfig')
const ThemeManager = require('./themeManager')

const logger = LoggerUtil.getLogger('SeriesManager')

/** Serie actualmente activa */
let activeSeries = null

/** Clave de la serie activa */
let activeKey = null

/**
 * Activa una serie usando la clave proporcionada.
 * Valida la clave, aplica el tema asociado y cambia el servidor si corresponde.
 *
 * @param {string} key - Clave de la serie a activar.
 * @returns {Promise<Object>} Resultado con {success, series, error}.
 */
exports.activate = async function(key) {
    if (!key || typeof key !== 'string') {
        return { success: false, series: null, error: 'Key inválida' }
    }

    const series = RemoteConfig.validateSeriesKey(key)

    if (!series) {
        logger.warn(`Key inválida intentada: ${key}`)
        return { success: false, series: null, error: 'Key no válida o expirada' }
    }

    activeSeries = series
    activeKey = key.toUpperCase().trim()

    // Guardar la clave en la configuración persistente
    ConfigManager.setSeriesKey(activeKey)
    ConfigManager.save()

    logger.info(`Serie activada: ${series.name} (key: ${activeKey})`)

    // Aplicar el tema asociado a la serie si existe
    if (series.theme) {
        await ThemeManager.apply(series.theme)
    }

    // Cambiar el servidor seleccionado si la serie lo especifica
    if (series.serverId) {
        ConfigManager.setSelectedServer(series.serverId)
        ConfigManager.save()
        logger.info(`Servidor cambiado a: ${series.serverId}`)
    }

    return { success: true, series: series, error: null }
}

/**
 * Restaura la serie guardada previamente en la configuración.
 * Si la clave ya no es válida, limpia la configuración.
 *
 * @returns {Promise<boolean>} true si se restauró correctamente.
 */
exports.restore = async function() {
    const savedKey = ConfigManager.getSeriesKey()

    if (!savedKey) {
        logger.debug('No hay serie guardada')
        return false
    }

    const result = await exports.activate(savedKey)

    if (!result.success) {
        logger.warn(`Serie guardada "${savedKey}" ya no es válida, limpiando`)
        ConfigManager.setSeriesKey(null)
        ConfigManager.save()
        return false
    }

    return true
}

/**
 * Desactiva la serie actual y restaura el tema por defecto.
 */
exports.deactivate = function() {
    activeSeries = null
    activeKey = null

    ConfigManager.setSeriesKey(null)
    ConfigManager.save()

    ThemeManager.reset()

    logger.info('Serie desactivada, volviendo a default')
}

/**
 * Devuelve la serie activa actualmente.
 * @returns {Object} Objeto con {key, series}.
 */
exports.getActive = function() {
    return { key: activeKey, series: activeSeries }
}

/**
 * Indica si hay una serie activa.
 * @returns {boolean}
 */
exports.isActive = function() {
    return activeSeries !== null
}

/**
 * Devuelve la lista de series disponibles con su información básica.
 * @returns {Object[]} Array de objetos con {name, streamer, description}.
 */
exports.getAvailableSeries = function() {
    const allSeries = RemoteConfig.getSeries()
    const result = []

    for (const [, seriesData] of Object.entries(allSeries)) {
        result.push({
            name: seriesData.name || 'Sin nombre',
            streamer: seriesData.streamer || '',
            description: seriesData.description || ''
        })
    }

    return result
}
