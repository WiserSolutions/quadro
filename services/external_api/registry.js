const request = requirep('request')

module.exports = class ExternalAPIRegistry {
  register(name, apiSpec) {
    const api = new APIWrapper(apiSpec)
    this[name] = api
    return api
  }
}

const APIRegistrationError = Q.Errors.declareError('APIRegistrationError')
const APIRequestError = Q.Errors.declareError('APIRequestError')

class APIWrapper {
  constructor(apiSpec) {
    const { host, timeout } = apiSpec
    if (!host) throw new APIRegistrationError('`host` not defined')

    this.host = host
    this.timeout = timeout

    this._setupHTTPVerbWrappers()
  }

  request(path, options) {
    const protocol = this.protocol || 'http'
    const url = `${protocol}://${this.host}${path}`

    let defaultOptions = { json: true, url }
    if (this.timeout) defaultOptions.timeout = this.timeout
    const requestOptions = Object.assign(defaultOptions, options)

    Q.log.info({ requestOptions }, 'Request options')

    return new Promise(function(resolve, reject) {
      request(requestOptions, function(err, response, body) {
        if (err) {
          let message = 'API Request failure'
          if (err.code) message += `: ${err.code}`
          return reject(new APIRequestError(message, { url, nestedError: err, code: err.code }))
        }

        const { statusCode } = response
        if (statusCode / 100 > 3) {
          reject(new APIRequestError({ url, statusCode }))
        }

        resolve(response.body)
      })
    })
  }

  _setupHTTPVerbWrappers() {
    ['get', 'post', 'put', 'head', 'delete'].forEach((method) => {
      this[method] = function(path, params) {
        const options = { method }
        if (method === 'get' || method === 'delete') {
          options.qs = params
        } else {
          options.body = params || {}
        }
        return this.request(path, options)
      }
    })
  }
}
