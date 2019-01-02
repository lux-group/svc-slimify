var slim = require('./slim');

function mount (app) {
  app.get('/api/slim*', slim);
}

module.exports.mount = mount
