/* eslint-disable ghost/ember/alias-model-in-controller */
import Controller from '@ember/controller';
import {empty} from '@ember/object/computed';
import {isInvalidError} from 'ember-ajax/errors';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default Controller.extend({
    ghostPaths: service(),
    ajax: service(),
    notifications: service(),
    settings: service(),

    leaveSettingsTransition: null,

    testNotificationDisabled: empty('settings.slackUrl'),

    actions: {
        save() {
            this.save.perform();
        },

        updateURL(value) {
            value = typeof value === 'string' ? value.trim() : value;
            this.set('settings.slackUrl', value);
        },

        updateUsername(value) {
            value = typeof value === 'string' ? value.trimLeft() : value;
            this.set('settings.slackUsername', value);
        },

        toggleLeaveSettingsModal(transition) {
            let leaveTransition = this.leaveSettingsTransition;

            if (!transition && this.showLeaveSettingsModal) {
                this.set('leaveSettingsTransition', null);
                this.set('showLeaveSettingsModal', false);
                return;
            }

            if (!leaveTransition || transition.targetName === leaveTransition.targetName) {
                this.set('leaveSettingsTransition', transition);

                // if a save is running, wait for it to finish then transition
                if (this.save.isRunning) {
                    return this.save.last.then(() => {
                        transition.retry();
                    });
                }

                // we genuinely have unsaved data, show the modal
                this.set('showLeaveSettingsModal', true);
            }
        },

        leaveSettings() {
            let transition = this.leaveSettingsTransition;

            if (!transition) {
                this.notifications.showAlert('Sorry, there was an error in the application. Please let the Ghost team know what happened.', {type: 'error'});
                return;
            }

            // roll back changes on model props
            this.settings.rollbackAttributes();

            return transition.retry();
        }
    },

    save: task(function* () {
        try {
            yield this.settings.validate();
            return yield this.settings.save();
        } catch (error) {
            if (error) {
                this.notifications.showAPIError(error);
                throw error;
            }
        }
    }).drop(),

    sendTestNotification: task(function* () {
        let notifications = this.notifications;
        let slackApi = this.get('ghostPaths.url').api('slack', 'test');

        try {
            yield this.save.perform();
            yield this.ajax.post(slackApi);
            notifications.showNotification('Test notification sent', {type: 'info', key: 'slack-test.send.success', description: 'Check your Slack channel for the test message'});
            return true;
        } catch (error) {
            notifications.showAPIError(error, {key: 'slack-test:send'});

            if (!isInvalidError(error)) {
                throw error;
            }
        }
    }).drop()
});
