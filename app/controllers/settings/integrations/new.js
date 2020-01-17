import Controller from '@ember/controller';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {alias} from '@ember/object/computed';

@classic
export default class NewController extends Controller {
    @alias('model')
    integration;

    @action
    save() {
        return this.integration.save();
    }

    @action
    cancel() {
        // 'new' route's dectivate hook takes care of rollback
        this.transitionToRoute('settings.integrations');
    }
}
