const request = requirep('request')
const backoff = require('backoff')

const APIRegistrationError = Q.Errors.declareError('APIRegistrationError')
const APIRequestError = Q.Errors.declareError('APIRequestError')

module.exports = class APIWrapper {
  constructor(apiSpec) {
    const { host, retry, timeout } = apiSpec
    if (!host) throw new APIRegistrationError('`host` not defined')

    this.host = host
    this.timeout = timeout
    this.retry = retry

    this._setupHTTPVerbWrappers()
  }

  request(path, options) {
    const protocol = this.protocol || 'http'
    const url = `${protocol}://${this.host}${path}`

    let defaultOptions = { json: true, url }
    if (this.timeout) defaultOptions.timeout = this.timeout
    const requestOptions = Object.assign(defaultOptions, options)

    return this._performHTTPRequestWithRetries(requestOptions)
  }

  _performHTTPRequestWithRetries(options) {
    if (!this.retry) return this._performHTTPRequest(options)

    const { strategy, times, startInterval } = this.retry

    return new Promise((resolve, reject) => {
      const requestAsCallback = (options, cb) => this._performHTTPRequest(options)
        .then(x => cb(null, x))
        .catch(e => cb(e))

      // https://github.com/MathieuTurcotte/node-backoff#functional
      const call = backoff.call(requestAsCallback, options, function(err, res) {
        if (err) return reject(err)
        resolve(res)
      })

      const initialDelay = startInterval || 2000
      const backoffStrategy = ['fib', 'fibonacci'].includes(strategy) ?
        new backoff.FibonacciStrategy({ initialDelay }) :
        new backoff.ExponentialStrategy({ initialDelay })
      call.setStrategy(backoffStrategy)
      call.failAfter(times || 5)
      call.start()
    })
  }

  _performHTTPRequest(options) {
    Q.log.trace({ options }, 'Request options')
    return new Promise((resolve, reject) => {
      request(options, (err, response, body) => {
        if (err) {
          return reject(this._buildRequestError(options, err, response))
        }

        const { statusCode } = response
        if (statusCode / 100 > 3) {
          return reject(this._buildRequestError(options, null, response))
        }

        resolve(response.body)
      })
    })
  }

  _buildRequestError(options, err, response) {
    let message = 'API Request failed'
    const extra = {}
    if (options.url) extra.url = options.url
    if (err) {
      if (err.code) {
        message += `: ${err.code}`
        extra.code = err.code
      }
      extra.nestedError = err
    }
    if (response) {
      extra.statusCode = response.statusCode
    }
    return new APIRequestError(message, extra)
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
