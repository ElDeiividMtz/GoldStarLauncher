/**
 * RemoteConfig
 *
 * Gestiona la configuración remota del launcher descargada desde el servidor.
 * Incluye configuración de temas, series, funcionalidades habilitadas,
 * enlaces sociales y verificación de versión mínima.
 */

const { LoggerUtil } = require('helios-core')
const CacheManager = require('./cacheManager')

const logger = LoggerUtil.getLogger('RemoteConfig')

/** Configuración remota activa */
let config = null

/** URL base del servidor */
let baseUrl = null

/** Indica si el módulo ha sido inicializado */
let initialized = false

/** Configuración por defecto utilizada como fallback */
const DEFAULT_CONFIG = {
    version: '1.0.0',
    launcher: {
        minVersion: '1.0.0',
        forceUpdate: false
    },
    features: {
        seriesEnabled: false,
        socialLinks: true,
        newsEnabled: true,
        mojangLogin: false,
        mojangStatus: true,
        mediaSection: false
    },
    ui: {
        socialLinks: [],
        media: [],
        landing: {
            launchButtonText: null
        }
    },
    themes: {
        default: {
            name: 'GoldStar Default',
            css: null,
            logo: null,
            backgrounds: [],
            colors: {
                primary: '#d4af37',
                primaryDark: '#b8962e',
                background: '#171614',
                surface: '#1a1a25',
                text: '#e0e0e0'
            }
        }
    },
    series: {},
    news: {
        rss: '',
        announcements: []
    }
}

/**
 * Inicializa el RemoteConfig descargando la configuración del servidor.
 *
 * @param {string} url - URL base del servidor.
 * @param {string} dataDir - Directorio de datos para el CacheManager.
 * @returns {Promise<boolean>} true si se cargó correctamente, false si se usó el fallback.
 */
exports.init = async function(url, dataDir) {
    baseUrl = url.replace(/\/+$/, '')

    CacheManager.init(dataDir)

    const configUrl = `${baseUrl}/remote-config.json`
    const cached = await CacheManager.fetch(configUrl, 'remote-config.json', 60)

    if (cached) {
        try {
            config = JSON.parse(cached.data)
            logger.info(`RemoteConfig cargado (${cached.fromCache ? 'cache' : 'servidor'})`)
            initialized = true
            return true
        } catch (err) {
            logger.error(`Error parseando remote-config.json: ${err.message}`)
        }
    }

    logger.warn('Usando configuración remota por defecto (fallback)')
    config = { ...DEFAULT_CONFIG }
    initialized = true
    return false
}

/**
 * Devuelve la configuración remota activa o la por defecto.
 * @returns {Object}
 */
exports.getConfig = function() {
    return config || DEFAULT_CONFIG
}

/**
 * Obtiene la configuración de un tema por su identificador.
 *
 * @param {string} themeId - Identificador del tema.
 * @returns {Object|null} Configuración del tema o null si no existe.
 */
exports.getTheme = function(themeId) {
    return (config && config.themes && config.themes[themeId]) || null
}

/**
 * Devuelve todos los temas disponibles.
 * @returns {Object}
 */
exports.getThemes = function() {
    return config?.themes || {}
}

/**
 * Valida una clave de serie y devuelve su configuración si es válida.
 *
 * @param {string} key - Clave de serie a validar.
 * @returns {Object|null} Configuración de la serie o null si no es válida.
 */
exports.validateSeriesKey = function(key) {
    if (!config || !config.series) {
        return null
    }

    const normalizedKey = key.toUpperCase().trim()
    return config.series[normalizedKey] || null
}

/**
 * Devuelve todas las series configuradas.
 * @returns {Object}
 */
exports.getSeries = function() {
    return config?.series || {}
}

/**
 * Verifica si la versión actual del launcher es compatible con la mínima requerida.
 *
 * @param {string} currentVersion - Versión actual del launcher.
 * @returns {Object} Objeto con compatible (bool), forceUpdate (bool) y minVersion (string).
 */
exports.checkVersion = function(currentVersion) {
    const semver = require('semver')

    const minVersion = config?.launcher?.minVersion || '1.0.0'
    const forceUpdate = config?.launcher?.forceUpdate || false

    return {
        compatible: semver.gte(currentVersion, minVersion),
        forceUpdate: forceUpdate,
        minVersion: minVersion
    }
}

/**
 * Devuelve la URL base del servidor.
 * @returns {string}
 */
exports.getBaseUrl = function() {
    return baseUrl
}

/**
 * Indica si el RemoteConfig ha sido inicializado.
 * @returns {boolean}
 */
exports.isInitialized = function() {
    return initialized
}
