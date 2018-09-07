import Application from '../app';
import config from '../config/environment';
import registerPowerDatepickerHelpers from '../tests/helpers/ember-power-datepicker';
import {setApplication} from '@ember/test-helpers';

registerPowerDatepickerHelpers();

setApplication(Application.create(config.APP));

mocha.setup({
    timeout: 15000,
    slow: 500
});

