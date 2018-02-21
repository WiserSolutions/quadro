const request = require('request')
const backoff = require('backoff')

const APIRegistrationError = Q.Errors.declare('APIRegistrationError')
const APIRequestError = Q.Errors.declare('APIRequestError')

module.exports = class APIWrapper {
  constructor(name, { host, retry, timeout }, stats) {
    if (!host) throw new APIRegistrationError('`host` not defined')

    this.name = name
    this.host = host
    this.timeout = timeout
    this.retry = retry
    this.stats = stats

    this._setupHTTPVerbWrappers()
  }

  request(path, options) {
    const protocol = this.protocol || 'http'
    const url = `${protocol}://${this.host}${path}`

    let defaultOptions = { json: true, url }
    if (this.timeout) defaultOptions.timeout = this.timeout
    const requestOptions = { ...defaultOptions, ...options }

    const start = Date.now()
    let err
    return this._performHTTPRequestWithRetries(requestOptions)
      .tapCatch(e => err = e)
      .finally(() => this._reportMetric('gauge', 'total_time', Date.now() - start, { err }))
  }

  _performHTTPRequestWithRetries(options) {
    if (!this.retry) return this._performHTTPRequest(options)

    const { strategy, times = 5, startInterval = 2000 } = this.retry

    return new Promise((resolve, reject) => {
      const requestAsCallback = (options, cb) => this._performHTTPRequest(options)
        .then(x => cb(null, x))
        .catch(e => cb(e))

      // https://github.com/MathieuTurcotte/node-backoff#functional
      const call = backoff.call(requestAsCallback, options, (err, res) => {
        this._reportMetric('gauge', 'retries', call.getNumRetries(), { err })

        if (err) return reject(err)
        resolve(res)
      })

      const backoffStrategy = ['fib', 'fibonacci'].includes(strategy) ?
        new backoff.FibonacciStrategy({ initialDelay: startInterval }) :
        new backoff.ExponentialStrategy({ initialDelay: startInterval })
      call.setStrategy(backoffStrategy)
      call.failAfter(times)
      call.start()
    })
  }

  _performHTTPRequest(options) {
    Q.log.trace({ options }, 'Request options')
    const start = Date.now()
    return new Promise((resolve, reject) => {
      request(options, (err, response, body) => {
        this._reportMetric('gauge', 'response_time',
          Date.now() - start, { err, response }
        )
        this._reportMetric('increment', 'calls', { err, response })

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

  _reportMetric(type, name, value, options) {
    const tags = { source: Q.app.name, target: this.name }

    const { err, response } = options || {}
    tags.outcome = err || (response && response.statusCode >= 400) ?
      'failure' : 'success'

    name = `quadro.external_api.${name}`

    if (type === 'increment') {
      this.stats.increment(name, tags)
    } else if (type === 'gauge') {
      this.stats.gauge(name, value, tags)
    } else throw new Error('Unknown metric type')
  }
}
