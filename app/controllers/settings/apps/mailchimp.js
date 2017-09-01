import Controller from '@ember/controller';
import {alias} from '@ember/object/computed';
import {inject as injectService} from '@ember/service';

export default Controller.extend({
    feature: injectService(),
    settings: injectService(),

    mailchimp: alias('model')
});
