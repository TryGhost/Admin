import Controller from '@ember/controller';
import classic from 'ember-classic-decorator';
import {computed} from '@ember/object';
import {inject as service} from '@ember/service';

/* eslint-disable ghost/ember/alias-model-in-controller */
@classic
export default class AboutController extends Controller {
    @service config;
    @service upgradeStatus;

    @computed
    get copyrightYear() {
        let date = new Date();
        return date.getFullYear();
    }
}
