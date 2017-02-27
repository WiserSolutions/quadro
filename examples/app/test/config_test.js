describe('config', function() {
  it('loads distinct configs', function() {
    expect(app.config.yaml.key).to.eql('devValue')
  })
})
