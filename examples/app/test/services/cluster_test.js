/* eslint-disable no-unused-expressions */

describe('Cluster Service', () => {
  it('dry run', async function () {
    const cluster = await Q.container.getAsync('cluster')
    expect(cluster.isMaster).to.be.true
    expect(cluster.clusteringActive).to.be.false
    expect(cluster.workers).to.be.length(0)

    cluster.numCPUs = 1
    cluster._init()
    expect(cluster.workers).to.be.length(0)
    const exit = this.sinon.stub(process, 'exit')

    try {
      cluster.shutdown()
    } catch (err) {
      process.exit.restore()
      throw err
    }
    expect(exit).to.be.calledOnce
    expect(cluster.workers).to.be.length(0)
  })

  it('live run', async function() {
    const cluster = await Q.container.getAsync('cluster')
    expect(cluster.isMaster).to.be.true
    expect(cluster.clusteringActive).to.be.false

    // manually force there to be 1 worker created
    expect(cluster.workers).to.be.length(0)
    cluster.numCPUs = 2
    cluster._init()
    expect(cluster.workers).to.be.length(1)

    // verify it does not double-init
    cluster._init()
    expect(cluster.workers).to.be.length(1)

    const exit = this.sinon.stub(process, 'exit')
    const kill = this.sinon.stub(cluster.workers[0].process, 'kill').throws()

    try {
      cluster.shutdown()
    } catch (err) {
      process.exit.restore()
      throw err
    }
    expect(exit).to.be.calledOnce
    expect(kill).to.be.calledOnce
    kill.restore()

    try {
      cluster.shutdown()
    } catch (err) {
      process.exit.restore()
      throw err
    }
    expect(exit).to.have.been.calledTwice
    cluster.workers = []

    expect(cluster.workers).to.be.length(0)
  })
})
