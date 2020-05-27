const amqp = require('amqplib')
const { EventEmitter } = require('events')
const { castArray } = require('lodash')

const DEFAULT_HEARTBEAT_MS = 5 * 1000

async function urlsByDistance(urls) {
  return (await Promise.all(
    urls.map(async u => {
      const start = Date.now()
      try {
        const conn = await amqp.connect(u)
        await conn.close()
        return [u, Date.now() - start]
      } catch (e) {
        return [u, Infinity]
      }
    })
  ))
    .sort((a, b) => a[1] - b[1])
    .map(i => i[0])
}

/**
 * Connection manager attempts to maintain a constant AMQP connection and will automatically attempt
 * reconnect if an issue occurs.
 * 
 * @event connect ({connection, url}) Emitted whenever we connect to a broker.
 * @event disconnect ({err}) Emitted whenever we disconnect from a broker.
 * @event closing Emitted when shutdown is initiated and no more messages will be accepted.
 * @event close Emitted when shutdown is complete.
 * @event blocked ({reason}) Emitted when the underlying connection emits a blocked message.
 * @event unblocked Emitted when the underlying connection emits an unblocked message.
 */
module.exports = class AmqpConnectionManager extends EventEmitter {
  /**
   * Create a RabbitMQ connection manager which maintains a connection at all times and
   * automatically reconnects as needed.
   *
   * @param {{amqp.Options.Connect}[]} urls An array of brokers to
   *  connect to. Takes connection objects defined by amqplib.
   * @param {number?} options.heartbeatInterval Heartbeat interval in ms.
   * @param {number?} options.reconnectTimeout Time to wait before trying to reconnect. Defaults to
   *  options.heartbeatInterval.
   */
  constructor(urls, options = {}) {
    super()
    // intentionally does not allow setting heartbeat to 0
    this.heartbeatInterval = options.heartbeatInterval || DEFAULT_HEARTBEAT_MS
    this.reconnectTimeout = options.reconnectTimeout || this.heartbeatInterval

    /** List of url objects: {url: string, connectionOptions?: object} */
    this.urls = castArray(urls || [])

    /** Whether this "connection" has been closed. Once closed, it should not be re-opened. */
    this._closed = false
    /** List of amqplib channels */
    this._channels = []
    /** Current amqplib connection */
    this._connection = null
    /** Promise of the current connecting act */
    this._connectPromise = null

    // There will be one listener per channel, and there could be a lot of channels, so disable warnings from node.
    this.setMaxListeners(0)

    // initialize connection process
    this._connect()
  }

  /**
   * Generate a promise which resolves when this next gets connected. This does not need to be
   * called and awaited as part of the workflow.
   *
   * @returns {Promise<Connection>}
   */
  async waitForConnection() {
    if (this._closed) throw new Error('Connection manager closed')
    if (this._connection) return this._connection
    await new Promise((resolve, reject) => {
      this.once('connect', resolve)
      this.once('close', () => reject(new Error('Connection closed')))
    })
    return this._connection
  }

  /**
   * Close any active connections and prevent new connections from being created. Fully shutdown the
   * connection manager.
   *
   * @returns {Promise<void>}
   */
  async close() {
    if (this._closed) return
    this._closed = true
    this.emit('closing')

    try {
      await this._connectPromise
    } catch (err) {
      // ignore errors while closing
    }

    try {
      await Promise.all(this._channels.map(c => c.close()))
    } catch (err) {
      // ignore errors closing channels
    }

    this._channels = []
    if (this._connection) {
      this._connection.removeAllListeners('close')
      this._connection.close()
    }
    this._connection = null
    this.emit('close')
  }

  /**
   * Check whether the connection is live presently.
   * @returns {boolean}
   */
  get isConnected() {
    return !!this._connection && !this._connectPromise
  }

  async createChannel() {
    throw new Error('Unimplemented')
  }

  async _connect(wait = false) {
    if (this._connectPromise) return this._connectPromise
    if (this._closed || this.isConnected) return null
    this._connectPromise = Promise.timeout(wait ? this.reconnectTimeout : 0)
      .then(() => this._connectInner())
      .then(() => this._connectPromise = null) // make sure it always get reset
      .catch(async err => {
        console.error('Exception connecting to amqp server', err)
        this._connection = null
        this._connectPromise = null
        this._connect(true)
        this.emit('disconnect', { err })
      })
  }

  async _connectInner() {
    if (!this.urls.length <= 0) throw new Error('amqp-connection-manager: No servers found')

    // sort urls by "distance"
    const url = await urlsByDistance(this._urls)[0]
    let conn = null

    // setup connection
    conn = await amqp.connect({ ...url, heartbeat: this.heartbeatInterval })
    this._connection = conn

    // configure handlers
    conn.on('blocked', reason => this.emit('blocked', { reason }))
    conn.on('unblocked', () => this.emit('unblocked'))
    // Can ignore error as it also triggers a `close` event after it
    conn.on('close', err => {
      this._connection = null
      this.emit('disconnect', { err })
      this._connect(true)
    })

    // we did it!
    this.emit('connect', { connection: conn, url })
  }
}
