/**
 * Script for welcome.ejs
 */
document.getElementById('welcomeButton').addEventListener('click', e => {
    if (isFeatureEnabled('seriesEnabled')) {
        switchView(VIEWS.welcome, VIEWS.series)
    } else {
        loginOptionsCancelEnabled(false)
        loginOptionsViewOnLoginSuccess = VIEWS.landing
        loginOptionsViewOnLoginCancel = VIEWS.loginOptions
        switchView(VIEWS.welcome, VIEWS.loginOptions)
    }
})
