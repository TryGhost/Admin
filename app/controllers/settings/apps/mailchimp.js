import Controller from 'ember-controller';
import injectService from 'ember-service/inject';
import {alias} from 'ember-computed';
import {task} from 'ember-concurrency';

export default Controller.extend({
    notifications: injectService(),
    settings: injectService(),
    config: injectService(),

    model: alias('settings.mailchimp'),

    save: task(function* () {
        let mailchimp = this.get('model');
        let settings = this.get('settings');

        try {
            settings.set('mailchimp', mailchimp);
            return yield settings.save();
        } catch (error) {
            if (error) {
                this.get('notifications').showAPIError(error);
                throw error;
            }
        }
    }).drop(),

    actions: {
        save() {
            this.get('save').perform();
        },

        update(value) {
            // TODO: update webhook
        }
    }
});
