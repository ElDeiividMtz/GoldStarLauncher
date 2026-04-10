/**
 * ExclusionManager
 *
 * Gestiona los patrones de exclusión para la sincronización de archivos.
 * Los archivos que coincidan con algún patrón no serán modificados ni eliminados
 * durante la actualización automática. Soporta patrones glob y puede cargar
 * exclusiones remotas desde el servidor.
 */

const { LoggerUtil } = require('helios-core')
const got = require('got')
const path = require('path')

const logger = LoggerUtil.getLogger('ExclusionManager')

/** Patrones de exclusión por defecto (configuración del usuario, capturas, logs, etc.) */
const DEFAULT_EXCLUSIONS = [
    'options.txt',
    'optionsof.txt',
    'optionsshaders.txt',
    'servers.dat',
    'journeymap/**',
    'replay_*',
    'screenshots/**',
    'logs/**',
    'crash-reports/**'
]

/** Patrones activos actualmente en uso */
let activePatterns = [...DEFAULT_EXCLUSIONS]

/** Indica si el manager ha sido inicializado */
let initialized = false

/**
 * Convierte un patrón glob a una expresión regular.
 * Soporta *, ** y ? como comodines.
 *
 * @param {string} pattern - Patrón glob a convertir.
 * @returns {RegExp} Expresión regular equivalente.
 */
function globToRegex(pattern) {
    let normalized = pattern.replace(/\\/g, '/')

    // Escapar caracteres especiales de regex excepto los comodines
    normalized = normalized.replace(/[.+^${}()|[\]]/g, '\\$&')

    // Convertir comodines glob a regex
    normalized = normalized
        .replace(/\*\*/g, '<<<GLOBSTAR>>>')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]')
        .replace(/<<<GLOBSTAR>>>/g, '.*')

    return new RegExp(`^${normalized}$`)
}

/**
 * Descarga la lista de exclusiones desde el servidor remoto.
 *
 * @param {string} serverUrl - URL base del servidor.
 * @param {number} [retries=3] - Número máximo de reintentos.
 * @returns {Promise<string[]|null>} Array de patrones o null si falla.
 */
async function fetchRemoteExclusions(serverUrl, retries = 3) {
    const url = serverUrl.replace(/\/+$/, '') + '/exclusions.json'

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await got(url, {
                responseType: 'json',
                timeout: { request: 10000 }
            })

            // Soportar formato array directo o {patterns: [...]}
            if (Array.isArray(response.body)) {
                logger.info(`Exclusiones remotas cargadas: ${response.body.length} patrones`)
                return response.body
            }

            if (response.body && Array.isArray(response.body.patterns)) {
                logger.info(`Exclusiones remotas cargadas: ${response.body.patterns.length} patrones`)
                return response.body.patterns
            }

            logger.warn('exclusions.json tiene formato inválido, usando lista por defecto')
            return null
        } catch (err) {
            // Si es un 404, simplemente no existe el archivo
            if (err.response && err.response.statusCode === 404) {
                logger.info('exclusions.json no encontrado en servidor, usando lista por defecto')
                return null
            }

            if (!(attempt < retries)) {
                logger.error(`No se pudo descargar exclusions.json tras ${retries} intentos: ${err.message}`)
                return null
            }

            const delay = 1000 * Math.pow(2, attempt)
            logger.warn(`Error descargando exclusions.json (intento ${attempt}/${retries}), reintentando en ${delay}ms...`)
            await new Promise((resolve) => setTimeout(resolve, delay))
        }
    }

    return null
}

/**
 * Inicializa el ExclusionManager, opcionalmente cargando exclusiones remotas.
 *
 * @param {string} [serverUrl] - URL base del servidor. Si se omite, usa solo los patrones por defecto.
 */
exports.init = async function(serverUrl) {
    if (serverUrl) {
        const remotePatterns = await fetchRemoteExclusions(serverUrl)
        activePatterns = (remotePatterns !== null) ? remotePatterns : [...DEFAULT_EXCLUSIONS]
    } else {
        activePatterns = [...DEFAULT_EXCLUSIONS]
    }

    initialized = true
    logger.info(`ExclusionManager inicializado con ${activePatterns.length} patrones de exclusión`)
    logger.debug(`Patrones activos: ${JSON.stringify(activePatterns)}`)
}

/**
 * Comprueba si una ruta de archivo está excluida según los patrones activos.
 *
 * @param {string} filePath - Ruta relativa del archivo a comprobar.
 * @returns {boolean} true si el archivo está excluido.
 */
exports.isExcluded = function(filePath) {
    if (!initialized) {
        logger.warn('ExclusionManager consultado sin inicializar, usando lista por defecto')
    }

    const normalized = filePath.replace(/\\/g, '/')

    for (const pattern of activePatterns) {
        if (globToRegex(pattern).test(normalized)) {
            return true
        }
    }

    return false
}

/**
 * Devuelve una copia de los patrones de exclusión activos.
 * @returns {string[]}
 */
exports.getActivePatterns = function() {
    return [...activePatterns]
}

/**
 * Devuelve una copia de los patrones de exclusión por defecto.
 * @returns {string[]}
 */
exports.getDefaultPatterns = function() {
    return [...DEFAULT_EXCLUSIONS]
}

/**
 * Indica si el ExclusionManager ha sido inicializado.
 * @returns {boolean}
 */
exports.isInitialized = function() {
    return initialized
}
