//plugins/index.js
import vuetify from './vuetify'
import toastification from './toastification'

export function registerPlugins(app) {
  app.use(vuetify)
}
