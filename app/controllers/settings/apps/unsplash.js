import Controller from 'ember-controller';
import injectService from 'ember-service/inject';
import {alias, empty} from 'ember-computed';
import {task} from 'ember-concurrency';

export default Controller.extend({
    notifications: injectService(),
    settings: injectService(),
    config: injectService(),
    unsplash: injectService(),

    model: alias('settings.unsplash.firstObject'),
    testRequestDisabled: empty('model.applicationId'),

    save: task(function* () {
        let unsplash = this.get('model');
        let settings = this.get('settings');

        try {
            settings.get('unsplash').clear().pushObject(unsplash);
            return yield settings.save();
        } catch (error) {
            if (error) {
                this.get('notifications').showAPIError(error);
                throw error;
            }
        }
    }).drop(),

    sendTestRequest: task(function* () {
        let notifications = this.get('notifications');
        let applicationId = this.get('model.applicationId');

        try {
            yield this.get('save').perform();
            yield this.get('unsplash').sendTestRequest(applicationId);
            return true;
        } catch (error) {
            notifications.showAPIError(error, {key: 'unsplash-test:send'});
        }
    }).drop(),

    actions: {
        save() {
            this.get('save').perform();
        },

        update(value) {
            this.set('model.isActive', value);
        },

        updateId(value) {
            this.set('model.applicationId', value);
        }
    }
});
