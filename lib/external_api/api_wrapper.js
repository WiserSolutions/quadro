const request = require('request')
const backoff = require('backoff')

const APIRegistrationError = Q.Errors.declare('APIRegistrationError')
const APIRequestError = Q.Errors.declare('APIRequestError')

module.exports = class APIWrapper {
  constructor(name, { host, retry, timeout, protocol = 'http' }, metrics) {
    if (!host) throw new APIRegistrationError('`host` not defined')

    this.metrics = metrics
    this.name = name
    this.host = host
    this.timeout = timeout
    this.retry = retry
    this.protocol = protocol
    this._setupHTTPVerbWrappers()
  }

  request(path, options) {
    const url = `${this.protocol}://${this.host}${path}`

    let defaultOptions = { json: true, url }
    if (this.timeout) defaultOptions.timeout = this.timeout
    const requestOptions = { ...defaultOptions, ...options }

    return this._performHTTPRequestWithRetries(requestOptions)
    // if we want to re-add total time metric ...
    // I do not believe it adds much value as we know the individual request rates and the
    // failure/retry rates, further retries *should* be uncommon.
    //   .finally(() => this._reportMetric('gauge', 'total_time', Date.now() - start, { err }))
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
        this.metrics.retries.inc({ api: this.name }, call.getNumRetries())

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
    const timer = this.metrics.duration.startTimer({ api: this.name })
    return new Promise((resolve, reject) => {
      request(options, (err, response) => {
        if (err) {
          return reject(this._buildRequestError(options, err, response))
        }
        timer()
        const sentiment = Math.floor(response.statusCode / 100)
        this.metrics.sentiment.inc({ api: this.name, sentiment })
        if (sentiment > 3) {
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
      this[method] = function(path, params, headers) {
        const options = { method }
        if (method === 'get' || method === 'delete') {
          options.qs = params
        } else {
          options.body = params || {}
        }
        options.headers = headers || {}
        return this.request(path, options)
      }
    })
  }
}
