import Controller from 'ember-controller';
import injectService from 'ember-service/inject';
import {alias, empty} from 'ember-computed';
import {task} from 'ember-concurrency';

export default Controller.extend({
    notifications: injectService(),
    settings: injectService(),
    config: injectService(),
    unsplash: injectService(),

    model: alias('settings.unsplash'),
    testRequestDisabled: empty('model.applicationId'),

    save: task(function* () {
        let unsplash = this.get('model');
        let settings = this.get('settings');
        let hasValidated = unsplash.get('hasValidated');
        console.log(this.get('model'));

        if (this.get('config.unsplashAPI')) {
            hasValidated.pushObject('applicationId');
        } else {
            // TODO: Make validation work:
            yield unsplash.validate({property: 'applicationId'});
        }

        try {
            settings.set('unsplash', unsplash);
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
            console.log('value:', value);
            console.log('applicationId:', this.get('model.applicationId'));
            this.get('model.errors').remove('isActive');

            if (value && !this.get('model.applicationId')) {
                console.log('is invalid');
                this.get('model.errors').add(
                    'applicationId',
                    'Please enter a Application Id before enabling it'
                );
                this.get('model.hasValidated').pushObject('isActive');
                return;
            } else {
                this.set('model.isActive', value);
            }
        },

        updateId(value) {
            this.set('model.applicationId', value);
            this.get('model.errors').remove('applicationId');
        }
    }
});
