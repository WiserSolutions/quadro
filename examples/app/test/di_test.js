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
    expect(await container.get('svc')).to.eql(123)
  })

  it('registers async arrow functions', async function() {
    container.register('svc', async () => 1234)
    expect(await container.get('svc')).to.eql(1234)
  })

  it('registers destructuring', function() {
    container.register('a', { a: 3 })
    container.register('svc', ({ a } = a) => a ** 3 )
    expect(container.get('svc')).to.eql(27)
  })

  describe('dependencies resolution', function() {
    it('for functions', function() {
      function Test(a, b) { return a + b }
      container.register('svc', Test)
      container.register('a', 1)
      container.register('b', 2)
      expect(container.get('svc')).to.eql(3)
    })

    it('classes', function() {
      class Test{ constructor(a, b) {/*hello*/this.a = a; this.b = b}; foo() { return this.a**2 + this.b**2}}
      container.register('svc', Test)
      container.register('a', 1)
      container.register('b', 2)
      expect(container.get('svc').foo()).to.eql(5)
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
})
