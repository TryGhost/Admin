import Controller from '@ember/controller';
import {alias} from '@ember/object/computed';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default Controller.extend({
    notifications: service(),
    settings: service(),

    model: alias('settings.amp'),

    leaveSettingsTransition: null,

    save: task(function* () {
        let amp = this.get('model');
        let settings = this.get('settings');

        settings.set('amp', amp);

        try {
            return yield settings.save();
        } catch (error) {
            this.get('notifications').showAPIError(error);
            throw error;
        }
    }).drop(),

    actions: {
        update(value) {
            this.set('model', value);
        },

        save() {
            this.get('save').perform();
        },

        toggleLeaveSettingsModal(transition) {
            let leaveTransition = this.get('leaveSettingsTransition');

            if (!transition && this.get('showLeaveSettingsModal')) {
                this.set('leaveSettingsTransition', null);
                this.set('showLeaveSettingsModal', false);
                return;
            }

            if (!leaveTransition || transition.targetName === leaveTransition.targetName) {
                this.set('leaveSettingsTransition', transition);

                // if a save is running, wait for it to finish then transition
                if (this.get('save.isRunning')) {
                    return this.get('save.last').then(() => {
                        transition.retry();
                    });
                }

                // we genuinely have unsaved data, show the modal
                this.set('showLeaveSettingsModal', true);
            }
        },

        leaveSettings() {
            let transition = this.get('leaveSettingsTransition');
            let settings = this.get('settings');

            if (!transition) {
                this.get('notifications').showAlert('Sorry, there was an error in the application. Please let the Ghost team know what happened.', {type: 'error'});
                return;
            }

            // roll back changes on model props
            settings.rollbackAttributes();

            return transition.retry();
        }
    }
});
