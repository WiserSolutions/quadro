const Container = require('../../../lib/di/container')

describe('di', function() {
  let container
  beforeEach(function() { container = new Container() })
  it('registers constant', function() {
    container.register('svc', '123')
    expect(container.get('svc')).to.eql('123')
  })

  it('registers class', function() {
    class Test {}
    container.register('svc', Test)
    expect(container.get('svc')).to.be.instanceOf(Test)
  })

  it('registers functions', function() {
    function Test() { return 'hello' }
    container.register('svc', Test)
    expect(container.get('svc')).to.eql('hello')
  })

  it('registers anonymous functions', function() {
    container.register('svc', function() { return 123 })
    expect(container.get('svc')).to.eql(123)
  })

  it('registers arrow functions', function() {
    container.register('svc', () => 123)
    expect(container.get('svc')).to.eql(123)
  })

  it('registers async functions', async function() {
    container.register('svc', async function() { return 123 })
    expect(await container.getAsync('svc')).to.eql(123)
  })

  it('registers async arrow functions', async function() {
    container.register('svc', async () => 1234)
    expect(await container.getAsync('svc')).to.eql(1234)
  })

  it('registers destructuring', function() {
    container.register('a', { a: 3 })
    container.register('svc', ({ a } = a) => a ** 3 )
    expect(container.get('svc')).to.eql(27)
  })

  describe('initializable objects', function() {
    it('initializes objects', function() {
      container.register('a', class {
        initialize() {
          this.foo = 'bar'
        }
      })
      expect(container.get('a').foo).to.eql('bar')
    })

    it('supports async initialize', async function() {
      container.register('a', class {
        async initialize() {
          return await Promise.delay(50).then(() => this.foo = 'bar')
        }
      })
      let svc = await container.getAsync('a')
      expect(svc.foo).to.eql('bar')
    })

    it('supports generator initialize', async function() {
      container.register('a', class {
        *initialize() {
          return yield Promise.delay(50).then(() => this.foo = 'bar')
        }
      })
      let svc = await container.getAsync('a')
      expect(svc.foo).to.eql('bar')
    })

    it('throws exception if `get` is called instead of `getAsync`', async function() {
      container.register('a', class {
        *initialize() {
          return yield Promise.delay(50).then(() => this.foo = 'bar')
        }
      })
      expect(() => container.get('a')).to.throw(Error, 'use `getAsync` instead')
    })
  })

  describe('dependencies resolution', function() {
    it('supports functions', function() {
      function Test(a, b) { log.info({ a, b }); return a + b }
      container.register('svc', Test)
      container.register('a', 1)
      container.register('b', 2)
      expect(container.get('svc')).to.eql(3)
    })

    it('supports classes', function() {
      class Test{ constructor(a, b) { this.a = a; this.b = b}; foo() { return this.a**2 + this.b**2 } }
      container.register('svc', Test)
      container.register('a', 1)
      container.register('b', 2)
      expect(container.get('svc').foo()).to.eql(5)
    })

    it('supports async dependencies', async function() {
      container.register('a', async function() { return 5 })
      container.register('svc', function(a) { return 2 * a })
      expect(await container.getAsync('svc')).to.eql(10)
    })
  })

  describe('create', function() {
    it('creates an instance', function() {
      class Test{}
      expect(container.create(Test)).to.be.instanceOf(Test)
    })

    it('resolves dependencies', function() {
      class Test { constructor(a) { this.a = a} }
      container.register('a', 1)
      let t = container.create(Test)
      expect(t.a).to.eql(1)
    })
  })

  describe('run', function() {
    it('runs the function', function() {
      expect(container.run(() => 1)).to.eql(1)
    })

    it('resolves dependencies', function() {
      container.register('a', 3)
      expect(container.run((a) => 2 * a)).to.eql(6)
    })
  })

  describe('createNested', function() {
    let nested
    beforeEach(function() { nested = container.createNested() })
    it('creates a new container', function() {
      expect(nested).to.be.instanceOf(Container)
    })

    it('resolves dependencies from parent scope', function() {
      function f(a, b) { return a + b }
      container.register('a', 1)
      nested.register('b', 2)
      nested.register('svc', f)
      expect(nested.get('svc')).to.eql(3)
    })
  })

  describe('scopes', function() {
    describe('singleton', function() {
      it('creates only one instance', function() {
        class Test { constructor() { this.a = Math.random() } }
        container.registerSingleton('a', Test)
        expect(container.get('a')).to.equal(container.get('a'))
      })
    })

    describe('transient', function() {
      it('is default lifetime', function() {
        class Test { constructor() { this.a = Math.random() } }
        container.register('a', Test)
        expect(container.get('a')).to.not.equal(container.get('a'))
      })
    })
  })
})
