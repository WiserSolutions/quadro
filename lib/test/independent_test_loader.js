// can be used like this
// ./mocha ./node_modules/quadro/lib/test/independent_loader.js test/**/*_test.js
// and other params for mocha
// enables usage of external testing tools and better integration with CI

const app = require('../index.js');
const path = require('path');

async function runInitializers(app, container, log) {
  let dirs = [path.join(app.quadroDir, 'lib'), app.appDir];
  let files = app.glob('test/initializers/*.js', { dirs });
  return Promise.map(files, _ => container.create(require(_)));
}

before(async function() {
  await app(); // load application

  let container = Q.container;

  let chai = require('chai');
  global.expect = chai.expect;
  chai.use(require('sinon-chai'));
  chai.use(require('chai-as-promised'));
  chai.use(require('chai-subset'));

  global.QT = { chai };

  // other globals
  global.nock = require('nock');
  global.pubsub = await container.getAsync('pubsub');

  await container.create(runInitializers);
});

