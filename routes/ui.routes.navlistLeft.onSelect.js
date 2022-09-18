import app from 'wampark'
import Routes from '../db/models/routes/index.js'

function truncate_with_ellipsis(s,maxLength) {
  if (s.length > maxLength) {
     return s.substring(0, maxLength) + '...'
  }
  return s
}

export default class UiComponent extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'ui.routes.navlistLeft.onSelect'
    })
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {
    // console.log('ui.routes.navlistLeft.onSelect', args, kwargs, details)

    const viewport = this.component('viewport')

    const navlistLeft = this.component('navlistLeft')
    const selected = await navlistLeft.method('getSelected')

    const doc = await Routes.findOne({_id: selected._id})

    if (doc) {
      // atualizar o formulario
      const document = Object.assign(doc.toObject(), {
        header: null,
        content: null,
        sourceCode: doc.getFileContent()
      })
      await viewport.setState(document)
    } else {
      viewport.Message({
        type: 'warn',
        message: `[WARN] Using selected content insted database record. Be careful!`
      })
      viewport.setState(selected)
    }

    viewport.setWindowTitle(`${selected._id}`)
    
  }
}

