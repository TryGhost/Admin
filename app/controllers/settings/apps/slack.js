import Controller from '@ember/controller';
import {alias} from '@ember/object/computed';
import {empty} from '@ember/object/computed';
import {inject as injectService} from '@ember/service';
import {isInvalidError} from 'ember-ajax/errors';
import {task} from 'ember-concurrency';

export default Controller.extend({
    ghostPaths: injectService(),
    ajax: injectService(),
    notifications: injectService(),
    settings: injectService(),

    model: alias('settings.slack.firstObject'),
    testNotificationDisabled: empty('model.url'),

    save: task(function* () {
        let slack = this.get('model');
        let settings = this.get('settings');

        try {
            yield slack.validate();
            settings.get('slack').clear().pushObject(slack);
            return yield settings.save();

        } catch (error) {
            if (error) {
                this.get('notifications').showAPIError(error);
                throw error;
            }
        }
    }).drop(),

    sendTestNotification: task(function* () {
        let notifications = this.get('notifications');
        let slackApi = this.get('ghostPaths.url').api('slack', 'test');

        try {
            yield this.get('save').perform();
            yield this.get('ajax').post(slackApi);
            notifications.showNotification('Check your Slack channel for the test message!', {type: 'info', key: 'slack-test.send.success'});
            return true;

        } catch (error) {
            notifications.showAPIError(error, {key: 'slack-test:send'});

            if (!isInvalidError(error)) {
                throw error;
            }
        }
    }).drop(),

    actions: {
        save() {
            this.get('save').perform();
        },

        updateURL(value) {
            this.set('model.url', value);
            this.get('model.errors').clear();
        }
    }
});
