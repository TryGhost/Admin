import resolver from './helpers/resolver';
import {setResolver} from 'ember-mocha';

setResolver(resolver);

/* jshint ignore:start */
mocha.setup({
    timeout: 25000,
    slow: 500
});
/* jshint ignore:end */
