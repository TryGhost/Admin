import classic from 'ember-classic-decorator';
import {alias} from '@ember/object/computed';
import {computed} from '@ember/object';
import {inject as service} from '@ember/service';
/* eslint-disable ghost/ember/alias-model-in-controller */
import Controller from '@ember/controller';
import config from 'ghost-admin/config/environment';
import copyTextToClipboard from 'ghost-admin/utils/copy-text-to-clipboard';
import {task} from 'ember-concurrency-decorators';
import {timeout} from 'ember-concurrency';

@classic
export default class ZapierController extends Controller {
    @service
    ghostPaths;

    isTesting = undefined;

    init() {
        super.init(...arguments);
        if (this.isTesting === undefined) {
            this.isTesting = config.environment === 'test';
        }
    }

    @alias('model')
    integration;

    @computed
    get apiUrl() {
        let origin = window.location.origin;
        let subdir = this.ghostPaths.subdir;
        let url = this.ghostPaths.url.join(origin, subdir);

        return url.replace(/\/$/, '');
    }

    @task
    *copyAdminKey() {
        copyTextToClipboard(this.integration.adminKey.secret);
        yield timeout(3000);
    }

    @task
    *copyApiUrl() {
        copyTextToClipboard(this.apiUrl);
        yield timeout(3000);
    }
}
