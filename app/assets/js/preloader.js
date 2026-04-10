const {ipcRenderer}  = require('electron')
const fs             = require('fs-extra')
const os             = require('os')
const path           = require('path')

const ConfigManager  = require('./configmanager')
const { DistroAPI }  = require('./distromanager')
const LangLoader     = require('./langloader')
const RemoteConfig   = require('./remoteConfig')
const SeriesManager  = require('./seriesManager')
const { LoggerUtil } = require('helios-core')
// eslint-disable-next-line no-unused-vars
const { HeliosDistribution } = require('helios-core/common')

const logger = LoggerUtil.getLogger('Preloader')

logger.info('Loading..')

ConfigManager.load()

DistroAPI['commonDir'] = ConfigManager.getCommonDirectory()
DistroAPI['instanceDir'] = ConfigManager.getInstanceDirectory()

LangLoader.setupLanguage()

function onDistroLoad(data){
    if(data != null){
        if(ConfigManager.getSelectedServer() == null || data.getServerById(ConfigManager.getSelectedServer()) == null){
            logger.info('Determining default selected server..')
            ConfigManager.setSelectedServer(data.getMainServer().rawServer.id)
            ConfigManager.save()
        }
    }
    ipcRenderer.send('distributionIndexDone', data != null)
}

async function bootSequence() {
    const modpackUrl = ConfigManager.getModpackUrl()

    if (modpackUrl) {
        try {
            await RemoteConfig.init(modpackUrl, ConfigManager.getDataDirectory())
            logger.info('RemoteConfig cargado correctamente')

            const restored = await SeriesManager.restore()
            if (restored) {
                const active = SeriesManager.getActive()
                logger.info(`Serie restaurada: ${active.series?.name || active.key}`)
            }
        } catch (err) {
            logger.warn('Error cargando RemoteConfig, continuando sin el:', err.message)
        }
    }

    try {
        const heliosDistro = await DistroAPI.getDistribution()
        logger.info('Loaded distribution index.')
        onDistroLoad(heliosDistro)
    } catch (err) {
        logger.info('Failed to load distribution index.')
        logger.error(err)
        onDistroLoad(null)
    }
}

bootSequence()

fs.remove(path.join(os.tmpdir(), ConfigManager.getTempNativeFolder()), (err) => {
    if(err){
        logger.warn('Error while cleaning natives directory', err)
    } else {
        logger.info('Cleaned natives directory.')
    }
})
