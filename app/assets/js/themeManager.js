/**
 * ThemeManager
 *
 * Gestiona la aplicación de temas visuales en el launcher.
 * Soporta inyección de CSS remoto, cambio de colores via CSS custom properties,
 * reemplazo de logos y fondos de pantalla descargados del servidor.
 */

const { LoggerUtil } = require('helios-core')
const CacheManager = require('./cacheManager')
const RemoteConfig = require('./remoteConfig')
const path = require('path')
const { pathToFileURL } = require('url')

const logger = LoggerUtil.getLogger('ThemeManager')

/** ID del tema activo */
let activeThemeId = 'default'

/** Configuración del tema activo */
let activeTheme = null

/** Elemento <style> inyectado en el DOM */
let injectedStyleEl = null

/**
 * Inyecta CSS personalizado en el documento.
 * Si ya hay un estilo inyectado previamente, lo reemplaza.
 *
 * @param {string} cssContent - Contenido CSS a inyectar.
 */
function injectCSS(cssContent) {
    // Eliminar estilo anterior si existe
    if (injectedStyleEl && injectedStyleEl.parentNode) {
        injectedStyleEl.parentNode.removeChild(injectedStyleEl)
    }

    injectedStyleEl = document.createElement('style')
    injectedStyleEl.id = 'gs-remote-theme'
    injectedStyleEl.textContent = cssContent
    document.head.appendChild(injectedStyleEl)
}

/**
 * Aplica los colores del tema como CSS custom properties en el elemento raíz.
 *
 * @param {Object} theme - Configuración del tema con propiedad 'colors'.
 */
function applyColors(theme) {
    if (!theme || !theme.colors) {
        return
    }

    const root = document.documentElement
    const colors = theme.colors

    if (colors.primary) {
        root.style.setProperty('--gs-primary', colors.primary)
    }
    if (colors.primaryDark) {
        root.style.setProperty('--gs-primary-dark', colors.primaryDark)
    }
    if (colors.background) {
        root.style.setProperty('--gs-background', colors.background)
    }
    if (colors.surface) {
        root.style.setProperty('--gs-surface', colors.surface)
    }
    if (colors.text) {
        root.style.setProperty('--gs-text', colors.text)
    }

    logger.debug(`Colores aplicados: primary=${colors.primary || 'default'}`)
}

/**
 * Descarga y aplica el logo del tema a todos los elementos de logo del launcher.
 *
 * @param {string} themeId - Identificador del tema.
 * @param {string} logoUrl - URL del logo remoto.
 */
async function applyLogo(themeId, logoUrl) {
    const localPath = await CacheManager.fetchBinary(logoUrl, `themes/${themeId}/logo.png`, 3600)

    if (localPath) {
        const elements = document.querySelectorAll('.gs-logo, #server_selection_header img, .loginLogoImage')
        const fileUrl = pathToFileURL(localPath).toString()

        elements.forEach((el) => {
            if (el.tagName === 'IMG') {
                el.src = fileUrl
            } else {
                el.style.backgroundImage = `url('${fileUrl}')`
            }
        })

        logger.debug(`Logo actualizado: ${path.basename(localPath)}`)
    }
}

/**
 * Descarga y aplica uno de los fondos de pantalla del tema de forma aleatoria.
 *
 * @param {string} themeId - Identificador del tema.
 * @param {string[]} backgroundUrls - Array de URLs de imágenes de fondo.
 */
async function applyBackgrounds(themeId, backgroundUrls) {
    const localPaths = []

    for (let i = 0; i < backgroundUrls.length; i++) {
        const localPath = await CacheManager.fetchBinary(
            backgroundUrls[i],
            `themes/${themeId}/backgrounds/${i}.jpg`,
            3600
        )
        if (localPath) {
            localPaths.push(localPath)
        }
    }

    if (localPaths.length > 0) {
        // Seleccionar un fondo aleatorio
        const selected = localPaths[Math.floor(Math.random() * localPaths.length)]
        const fileUrl = pathToFileURL(selected).toString()

        document.body.style.backgroundImage = `url('${fileUrl}')`
        document.body.style.backgroundSize = 'cover'
        document.body.style.backgroundPosition = 'center'

        logger.info(`Background aplicado: ${path.basename(selected)} (de ${localPaths.length} opciones)`)
    }
}

/**
 * Aplica un tema completo: CSS, colores, logo y fondos.
 *
 * @param {string} themeId - Identificador del tema a aplicar.
 * @returns {Promise<boolean>} true si el tema se aplicó correctamente.
 */
exports.apply = async function(themeId) {
    const theme = RemoteConfig.getTheme(themeId)

    if (!theme) {
        logger.warn(`Tema "${themeId}" no encontrado, usando default`)
        activeThemeId = 'default'
        activeTheme = RemoteConfig.getTheme('default')
        applyColors(activeTheme)
        return false
    }

    activeThemeId = themeId
    activeTheme = theme

    logger.info(`Aplicando tema: ${themeId} (${theme.name || themeId})`)

    // Inyectar CSS remoto del tema
    if (theme.css) {
        try {
            const cached = await CacheManager.fetch(theme.css, `themes/${themeId}/theme.css`, 300)
            if (cached) {
                injectCSS(cached.data)
                logger.info(`CSS del tema inyectado (${cached.fromCache ? 'cache' : 'remoto'})`)
            }
        } catch (err) {
            logger.error(`Error cargando CSS del tema: ${err.message}`)
        }
    }

    // Aplicar colores
    if (theme.colors) {
        applyColors(theme)
    }

    // Aplicar logo
    if (theme.logo) {
        await applyLogo(themeId, theme.logo)
    }

    // Aplicar fondos de pantalla
    if (theme.backgrounds && theme.backgrounds.length > 0) {
        await applyBackgrounds(themeId, theme.backgrounds)
    }

    logger.info(`Tema "${themeId}" aplicado correctamente`)
    return true
}

/**
 * Devuelve la información del tema activo.
 * @returns {Object} Objeto con {id, theme}.
 */
exports.getActiveTheme = function() {
    return { id: activeThemeId, theme: activeTheme }
}

/**
 * Resetea el tema a los valores por defecto, eliminando CSS inyectado
 * y las custom properties de colores.
 */
exports.reset = function() {
    // Eliminar CSS inyectado
    if (injectedStyleEl && injectedStyleEl.parentNode) {
        injectedStyleEl.parentNode.removeChild(injectedStyleEl)
        injectedStyleEl = null
    }

    // Eliminar custom properties de colores
    const root = document.documentElement
    root.style.removeProperty('--gs-primary')
    root.style.removeProperty('--gs-primary-dark')
    root.style.removeProperty('--gs-background')
    root.style.removeProperty('--gs-surface')
    root.style.removeProperty('--gs-text')

    activeThemeId = 'default'
    activeTheme = null

    logger.info('Tema reseteado a default')
}
