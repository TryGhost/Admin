/* eslint-env node */
/* eslint-disable no-var,object-shorthand */
var EngineAddon = require('ember-engines/lib/engine-addon');

module.exports = EngineAddon.extend({
    name: 'slack',
    lazyLoading: true,

    isDevelopingAddon: function () {
        return true;
    }
});
