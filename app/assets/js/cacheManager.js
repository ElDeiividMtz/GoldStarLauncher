/**
 * CacheManager
 *
 * Gestiona una caché local en disco para recursos descargados del servidor.
 * Soporta caché de texto y binarios con TTL configurable y fallback a
 * versiones anteriores si la descarga falla.
 */

const { LoggerUtil } = require('helios-core')
const got = require('got')
const fs = require('fs-extra')
const path = require('path')
const crypto = require('crypto')

const logger = LoggerUtil.getLogger('CacheManager')

/** Directorio raíz de la caché */
let cacheDir = null

/** Ruta al archivo de metadatos de la caché */
let metaPath = null

/** Metadatos de los archivos en caché (hash -> info) */
let meta = {}

/**
 * Guarda los metadatos de la caché en disco.
 */
function saveMeta() {
    try {
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))
    } catch (err) {
        logger.error(`Error guardando meta de cache: ${err.message}`)
    }
}

/**
 * Inicializa el CacheManager creando el directorio de caché y cargando metadatos.
 *
 * @param {string} dataDir - Directorio base donde crear la carpeta 'cache'.
 */
exports.init = function(dataDir) {
    cacheDir = path.join(dataDir, 'cache')
    metaPath = path.join(cacheDir, 'meta.json')

    fs.ensureDirSync(cacheDir)

    if (fs.existsSync(metaPath)) {
        try {
            meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
        } catch {
            meta = {}
        }
    }

    logger.info(`CacheManager inicializado: ${cacheDir}`)
}

/**
 * Descarga un recurso de texto con caché. Si el recurso está en caché y no ha
 * expirado, se devuelve la versión local. Si la descarga falla, se usa la caché anterior.
 *
 * @param {string} url - URL del recurso a descargar.
 * @param {string} localName - Nombre/ruta relativa dentro de la caché.
 * @param {number} [ttl=300] - Tiempo de vida en segundos.
 * @returns {Promise<Object|null>} Objeto con {data, fromCache, path} o null si falla.
 */
exports.fetch = async function(url, localName, ttl = 300) {
    const localPath = path.join(cacheDir, localName)
    const urlHash = crypto.createHash('md5').update(url).digest('hex')

    // Verificar si hay caché válida
    if (fs.existsSync(localPath) && meta[urlHash]) {
        const age = (Date.now() - meta[urlHash].timestamp) / 1000

        if (age < ttl) {
            logger.debug(`Cache hit: ${localName} (${Math.round(age)}s)`)
            return { data: fs.readFileSync(localPath, 'utf8'), fromCache: true, path: localPath }
        }
    }

    // Descargar del servidor
    try {
        const response = await got(url, {
            timeout: { request: 15000 },
            headers: { 'User-Agent': 'GoldStarLauncher/1.0' }
        })

        fs.ensureDirSync(path.dirname(localPath))
        fs.writeFileSync(localPath, response.body)

        meta[urlHash] = {
            url: url,
            localPath: localName,
            timestamp: Date.now(),
            etag: response.headers.etag || null,
            size: response.body.length
        }
        saveMeta()

        logger.info(`Descargado: ${localName} (${response.body.length} bytes)`)
        return { data: response.body, fromCache: false, path: localPath }
    } catch (err) {
        // Si falla la descarga pero hay caché anterior, usarla
        if (fs.existsSync(localPath)) {
            logger.warn(`Error descargando ${url}, usando cache anterior: ${err.message}`)
            return { data: fs.readFileSync(localPath, 'utf8'), fromCache: true, path: localPath }
        }

        logger.error(`Error descargando ${url} y sin cache local: ${err.message}`)
        return null
    }
}

/**
 * Descarga un recurso binario (imágenes, assets) con caché.
 * Devuelve la ruta local del archivo descargado.
 *
 * @param {string} url - URL del recurso binario.
 * @param {string} localName - Nombre/ruta relativa dentro de la caché.
 * @param {number} [ttl=3600] - Tiempo de vida en segundos.
 * @returns {Promise<string|null>} Ruta local del archivo o null si falla.
 */
exports.fetchBinary = async function(url, localName, ttl = 3600) {
    const localPath = path.join(cacheDir, localName)
    const urlHash = crypto.createHash('md5').update(url).digest('hex')

    // Verificar si hay caché válida
    if (fs.existsSync(localPath) && meta[urlHash] && (Date.now() - meta[urlHash].timestamp) / 1000 < ttl) {
        return localPath
    }

    // Descargar del servidor usando streams
    try {
        const { pipeline } = require('stream/promises')

        fs.ensureDirSync(path.dirname(localPath))

        const source = got.stream(url, {
            timeout: { request: 30000 },
            headers: { 'User-Agent': 'GoldStarLauncher/1.0' }
        })
        const target = fs.createWriteStream(localPath)

        await pipeline(source, target)

        meta[urlHash] = {
            url: url,
            localPath: localName,
            timestamp: Date.now(),
            size: fs.statSync(localPath).size
        }
        saveMeta()

        logger.info(`Asset descargado: ${localName}`)
        return localPath
    } catch (err) {
        // Si falla pero hay caché anterior, usarla
        if (fs.existsSync(localPath)) {
            logger.warn(`Error descargando asset ${url}, usando cache: ${err.message}`)
            return localPath
        }

        logger.error(`Error descargando asset: ${err.message}`)
        return null
    }
}

/**
 * Devuelve la ruta absoluta de un archivo dentro de la caché.
 *
 * @param {string} localName - Nombre/ruta relativa dentro de la caché.
 * @returns {string} Ruta absoluta.
 */
exports.getCachePath = function(localName) {
    return path.join(cacheDir, localName)
}

/**
 * Limpia completamente la caché eliminando todos los archivos y metadatos.
 */
exports.clear = async function() {
    await fs.emptyDir(cacheDir)
    meta = {}
    saveMeta()
    logger.info('Cache limpiado completamente')
}
