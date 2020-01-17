import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';
/* eslint-disable ghost/ember/alias-model-in-controller */
import Controller from '@ember/controller';
import {task} from 'ember-concurrency-decorators';

@classic
export default class CodeInjectionController extends Controller {
    @service notifications;
    @service settings;

    @action
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
            if (this.get('save.isRunning')) {
                return this.get('save.last').then(() => {
                    transition.retry();
                });
            }

            // we genuinely have unsaved data, show the modal
            this.set('showLeaveSettingsModal', true);
        }
    }

    @action
    leaveSettings() {
        let transition = this.leaveSettingsTransition;
        let settings = this.settings;

        if (!transition) {
            this.notifications.showAlert('Sorry, there was an error in the application. Please let the Ghost team know what happened.', {type: 'error'});
            return;
        }

        // roll back changes on settings props
        settings.rollbackAttributes();

        return transition.retry();
    }

    @task
    *save() {
        let notifications = this.notifications;

        try {
            return yield this.settings.save();
        } catch (error) {
            notifications.showAPIError(error, {key: 'code-injection.save'});
            throw error;
        }
    }
}
