import app from 'wampark'
import Routes from '../db/models/routes/index.js'
import dayjs from 'dayjs'

export default class UiComponent extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'ui.routes.toolbar.new'
    })
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {

    const viewport = this.component('viewport')
    viewport.setState({
      sourceCode: Routes.generateFileContent({
        hash: String(Date.now()),
        header: `/**
 * 
 * Endpoint
 * 
 * By ${details.caller_authid}
 * Created: ${dayjs().format('YYYY-MM-DD')}
 * Updated: ${dayjs().format('YYYY-MM-DD')}
 * 
*/
`,
        content: '',
      })
    })

    const navlistLeft = this.component('navlistLeft')
    navlistLeft.setSelected( null)


  }
}