/**
 * AutoUpdateManager
 *
 * Gestiona la sincronización automática de archivos del juego comparando
 * un manifest remoto con los archivos locales. Descarga nuevos archivos,
 * actualiza los modificados y elimina los obsoletos.
 */

const { LoggerUtil } = require('helios-core')
const got = require('got')
const crypto = require('crypto')
const fs = require('fs-extra')
const path = require('path')
const { pipeline } = require('stream/promises')
const ExclusionManager = require('./exclusionManager')

const logger = LoggerUtil.getLogger('AutoUpdateManager')

/** Número máximo de reintentos para descargas */
const MAX_RETRIES = 3

/** Nombre del archivo de manifiesto */
const MANIFEST_FILENAME = 'manifest.json'

/** Tiempo límite para peticiones HTTP (ms) */
const REQUEST_TIMEOUT = 30000

/** Número de descargas concurrentes */
const CONCURRENT_DOWNLOADS = 4

/** URL base del servidor de archivos */
let baseUrl = null

/** Directorio local del juego */
let gameDir = null

/** Indica si el manager ha sido inicializado */
let initialized = false

/**
 * Calcula el hash SHA-256 de un archivo local.
 * @param {string} filePath - Ruta absoluta del archivo.
 * @returns {Promise<string>} Hash en hexadecimal.
 */
async function hashFile(filePath) {
    const hash = crypto.createHash('sha256')
    const stream = fs.createReadStream(filePath)
    return new Promise((resolve, reject) => {
        stream.on('data', (data) => hash.update(data))
        stream.on('end', () => resolve(hash.digest('hex')))
        stream.on('error', reject)
    })
}

/**
 * Descarga un archivo desde una URL y lo guarda en disco.
 * Reintenta automáticamente con backoff exponencial.
 *
 * @param {string} url - URL del archivo remoto.
 * @param {string} dest - Ruta local de destino.
 * @param {number} retries - Número máximo de reintentos.
 */
async function downloadFile(url, dest, retries = 3) {
    await fs.ensureDir(path.dirname(dest))

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const source = got.stream(url, { timeout: { request: 30000 } })
            const target = fs.createWriteStream(dest)
            return void await pipeline(source, target)
        } catch (err) {
            if (!(attempt < retries)) {
                throw new Error(`No se pudo descargar ${url} tras ${retries} intentos: ${err.message}`)
            }

            const delay = 1000 * Math.pow(2, attempt)
            logger.warn(`Error descargando ${path.basename(dest)} (intento ${attempt}/${retries}), reintentando en ${delay}ms...`)
            await new Promise((resolve) => setTimeout(resolve, delay))
        }
    }
}

/**
 * Obtiene el manifest del servidor remoto.
 * @returns {Promise<Object>} Contenido parseado del manifest.
 */
async function fetchManifest() {
    const url = baseUrl.replace(/\/+$/, '') + '/manifest.json'

    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            return (await got(url, {
                responseType: 'json',
                timeout: { request: 30000 }
            })).body
        } catch (err) {
            if (!(attempt < 3)) {
                throw new Error(`No se pudo descargar manifest.json: ${err.message}`)
            }

            const delay = 1000 * Math.pow(2, attempt)
            logger.warn(`Error descargando manifest (intento ${attempt}/3), reintentando en ${delay}ms...`)
            await new Promise((resolve) => setTimeout(resolve, delay))
        }
    }
}

/**
 * Recorre recursivamente un directorio y devuelve las rutas relativas de todos los archivos.
 *
 * @param {string} dir - Directorio raíz a recorrer.
 * @param {string} prefix - Prefijo acumulado para rutas relativas.
 * @returns {Promise<string[]>} Lista de rutas relativas de archivos.
 */
async function walkDir(dir, prefix = '') {
    const results = []

    if (!await fs.pathExists(dir)) {
        return results
    }

    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
        const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name

        if (entry.isDirectory()) {
            const subResults = await walkDir(path.join(dir, entry.name), relativePath)
            results.push(...subResults)
        } else if (entry.isFile()) {
            results.push(relativePath)
        }
    }

    return results
}

/**
 * Ejecuta un array de funciones asíncronas en lotes de tamaño fijo.
 *
 * @param {Function[]} tasks - Array de funciones que devuelven promesas.
 * @param {number} batchSize - Tamaño de cada lote.
 */
async function runInBatches(tasks, batchSize) {
    for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize)
        await Promise.all(batch.map((task) => task()))
    }
}

/**
 * Elimina recursivamente directorios vacíos.
 *
 * @param {string} dir - Directorio raíz donde buscar directorios vacíos.
 */
async function cleanEmptyDirs(dir) {
    if (!await fs.pathExists(dir)) {
        return
    }

    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const fullPath = path.join(dir, entry.name)
            await cleanEmptyDirs(fullPath)

            if ((await fs.readdir(fullPath)).length === 0) {
                await fs.remove(fullPath)
                logger.debug(`Directorio vacío eliminado: ${entry.name}`)
            }
        }
    }
}

/**
 * Inicializa el AutoUpdateManager con la URL del servidor y el directorio del juego.
 *
 * @param {string} url - URL base del servidor de archivos.
 * @param {string} dir - Directorio local del juego.
 */
exports.init = async function(url, dir) {
    baseUrl = url.replace(/\/+$/, '')
    gameDir = dir

    await ExclusionManager.init(baseUrl)

    initialized = true
    logger.info('AutoUpdateManager inicializado')
    logger.info(`  Servidor: ${baseUrl}`)
    logger.info(`  Directorio local: ${gameDir}`)
}

/**
 * Sincroniza los archivos locales con el servidor remoto.
 * Descarga archivos nuevos/modificados y elimina los obsoletos.
 *
 * @param {Function} [progressCallback] - Callback de progreso (current, total, fileName).
 * @returns {Promise<Object>} Resultado con contadores: added, updated, deleted, errors.
 */
exports.sync = async function(progressCallback) {
    if (!initialized) {
        throw new Error('AutoUpdateManager no inicializado. Llama a init() primero.')
    }

    const result = { added: 0, updated: 0, deleted: 0, errors: [] }
    let manifest

    logger.info('Descargando manifest del servidor...')

    try {
        manifest = await fetchManifest()
    } catch (err) {
        logger.error(`Error obteniendo manifest: ${err.message}`)
        result.errors.push(err.message)
        return result
    }

    if (!manifest || !Array.isArray(manifest.files)) {
        logger.error('Manifest inválido: falta la propiedad "files"')
        result.errors.push('Manifest inválido')
        return result
    }

    logger.info(`Manifest descargado: ${manifest.files.length} archivos en servidor`)

    // Crear mapa de archivos remotos (ruta -> {hash, size})
    const remoteFiles = new Map()
    for (const file of manifest.files) {
        const normalizedPath = file.path.replace(/\\/g, '/')
        remoteFiles.set(normalizedPath, {
            hash: file.hash.toLowerCase(),
            size: file.size
        })
    }

    // Escanear archivos locales
    logger.info('Escaneando archivos locales...')
    const localFiles = await walkDir(gameDir)
    new Set(localFiles)

    const toDownload = []
    const toDelete = []
    let progress = 0
    const totalSteps = remoteFiles.size + localFiles.length

    // Comparar archivos remotos con locales
    for (const [remotePath, remoteInfo] of remoteFiles) {
        if (ExclusionManager.isExcluded(remotePath)) {
            logger.debug(`Excluido (no se toca): ${remotePath}`)
            progress++
            continue
        }

        const localPath = path.join(gameDir, remotePath)

        if (await fs.pathExists(localPath)) {
            try {
                if (await hashFile(localPath) !== remoteInfo.hash) {
                    toDownload.push({ remotePath, reason: 'update' })
                }
            } catch (err) {
                logger.warn(`Error calculando hash de ${remotePath}: ${err.message}`)
                toDownload.push({ remotePath, reason: 'update' })
            }
        } else {
            toDownload.push({ remotePath, reason: 'add' })
        }

        progress++
        if (progressCallback) {
            progressCallback(progress, totalSteps, remotePath)
        }
    }

    // Detectar archivos locales que ya no existen en el servidor
    for (const localFile of localFiles) {
        if (ExclusionManager.isExcluded(localFile)) {
            progress++
        } else {
            if (!remoteFiles.has(localFile)) {
                toDelete.push(localFile)
            }
            progress++
            if (progressCallback) {
                progressCallback(progress, totalSteps, localFile)
            }
        }
    }

    // Resumen del análisis
    logger.info('Resultado del análisis:')
    logger.info(`  Nuevos: ${toDownload.filter((f) => f.reason === 'add').length}`)
    logger.info(`  Actualizados: ${toDownload.filter((f) => f.reason === 'update').length}`)
    logger.info(`  A eliminar: ${toDelete.length}`)

    // Descargar archivos nuevos y actualizados
    if (toDownload.length > 0) {
        logger.info(`Descargando ${toDownload.length} archivos...`)

        let completed = 0
        const totalDownloads = toDownload.length

        const downloadTasks = toDownload.map(({ remotePath, reason }) => async () => {
            const url = `${baseUrl}/${remotePath}`
            const dest = path.join(gameDir, remotePath)

            try {
                await downloadFile(url, dest)

                if (reason === 'add') {
                    result.added++
                } else {
                    result.updated++
                }

                completed++
                logger.info(`[${completed}/${totalDownloads}] ${reason === 'add' ? 'Nuevo' : 'Actualizado'}: ${remotePath}`)
            } catch (err) {
                logger.error(`Error descargando ${remotePath}: ${err.message}`)
                result.errors.push(`${remotePath}: ${err.message}`)
            }
        })

        await runInBatches(downloadTasks, 4)
    }

    // Eliminar archivos obsoletos
    if (toDelete.length > 0) {
        logger.info(`Eliminando ${toDelete.length} archivos obsoletos...`)

        for (const filePath of toDelete) {
            const fullPath = path.join(gameDir, filePath)

            try {
                await fs.remove(fullPath)
                result.deleted++
                logger.info(`Eliminado: ${filePath}`)
            } catch (err) {
                logger.error(`Error eliminando ${filePath}: ${err.message}`)
                result.errors.push(`delete ${filePath}: ${err.message}`)
            }
        }

        await cleanEmptyDirs(gameDir)
    }

    // Resumen final
    logger.info('Sincronización completada:')
    logger.info(`  Añadidos: ${result.added}`)
    logger.info(`  Actualizados: ${result.updated}`)
    logger.info(`  Eliminados: ${result.deleted}`)

    if (result.errors.length > 0) {
        logger.warn(`  Errores: ${result.errors.length}`)
    }

    return result
}

/**
 * Verifica si hay actualizaciones disponibles sin descargar nada.
 *
 * @returns {Promise<Object>} Objeto con hasUpdates, added, updated, deleted.
 */
exports.checkForUpdates = async function() {
    if (!initialized) {
        throw new Error('AutoUpdateManager no inicializado')
    }

    let manifest

    try {
        manifest = await fetchManifest()
    } catch (err) {
        logger.error(`Error verificando actualizaciones: ${err.message}`)
        return { hasUpdates: false, added: 0, updated: 0, deleted: 0 }
    }

    if (!manifest || !Array.isArray(manifest.files)) {
        return { hasUpdates: false, added: 0, updated: 0, deleted: 0 }
    }

    // Crear mapa de archivos remotos
    const remoteFiles = new Map()
    for (const file of manifest.files) {
        remoteFiles.set(file.path.replace(/\\/g, '/'), file.hash.toLowerCase())
    }

    let added = 0
    let updated = 0
    let deleted = 0

    // Comprobar archivos nuevos o modificados
    for (const [remotePath, remoteHash] of remoteFiles) {
        if (ExclusionManager.isExcluded(remotePath)) {
            continue
        }

        const localPath = path.join(gameDir, remotePath)

        if (await fs.pathExists(localPath)) {
            try {
                if (await hashFile(localPath) !== remoteHash) {
                    updated++
                }
            } catch {
                updated++
            }
        } else {
            added++
        }
    }

    // Comprobar archivos locales que ya no existen en el servidor
    const localFiles = await walkDir(gameDir)
    for (const localFile of localFiles) {
        if (!ExclusionManager.isExcluded(localFile) && !remoteFiles.has(localFile)) {
            deleted++
        }
    }

    const hasUpdates = (added + updated + deleted) > 0

    if (hasUpdates) {
        logger.info(`Actualizaciones disponibles: +${added} ~${updated} -${deleted}`)
    } else {
        logger.info('Todo está al día, no hay actualizaciones')
    }

    return { hasUpdates, added, updated, deleted }
}

/**
 * Indica si el AutoUpdateManager ha sido inicializado.
 * @returns {boolean}
 */
exports.isInitialized = function() {
    return initialized
}
