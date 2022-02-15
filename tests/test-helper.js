import * as QUnit from 'qunit';
import Application from 'ghost-admin/app';
import config from 'ghost-admin/config/environment';
import registerWaiter from 'ember-raf-scheduler/test-support/register-waiter';
import start from 'ember-exam/test-support/start';
import {setApplication} from '@ember/test-helpers';
import {setup} from 'qunit-dom';

setApplication(Application.create(config.APP));

registerWaiter();

setup(QUnit.assert);

start();
