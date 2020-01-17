import Controller from '@ember/controller';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {inject as controller} from '@ember/controller';
import {inject as service} from '@ember/service';

/* eslint-disable ghost/ember/alias-model-in-controller */
@classic
export default class ImportController extends Controller {
    @controller members;
    @service router;

    @action
    fetchNewMembers() {
        this.members.fetchMembers.perform();
    }

    @action
    close() {
        this.router.transitionTo('members');
    }
}
