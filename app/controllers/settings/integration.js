import Controller from '@ember/controller';
import classic from 'ember-classic-decorator';
import copyTextToClipboard from 'ghost-admin/utils/copy-text-to-clipboard';
import {
    IMAGE_EXTENSIONS,
    IMAGE_MIME_TYPES
} from 'ghost-admin/components/gh-image-uploader';
import {action, computed} from '@ember/object';
import {alias} from '@ember/object/computed';
import {htmlSafe} from '@ember/string';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency-decorators';
import {timeout} from 'ember-concurrency';

@classic
export default class IntegrationController extends Controller {
    @service config;
    @service ghostPaths;

    imageExtensions = IMAGE_EXTENSIONS;
    imageMimeTypes = IMAGE_MIME_TYPES;

    @alias('model')
    integration;

    @computed
    get apiUrl() {
        let origin = window.location.origin;
        let subdir = this.ghostPaths.subdir;
        let url = this.ghostPaths.url.join(origin, subdir);

        return url.replace(/\/$/, '');
    }

    @computed
    get allWebhooks() {
        return this.store.peekAll('webhook');
    }

    @computed('integration.id', 'allWebhooks.@each.{isNew,isDeleted}')
    get filteredWebhooks() {
        return this.allWebhooks.filter((webhook) => {
            let matchesIntegration = webhook.belongsTo('integration').id() === this.integration.id;

            return matchesIntegration
                && !webhook.isNew
                && !webhook.isDeleted;
        });
    }

    @computed('integration.iconImage')
    get iconImageStyle() {
        let url = this.integration.iconImage;
        if (url) {
            let styles = [
                `background-image: url(${url})`,
                'background-size: 50%',
                'background-position: 50%',
                'background-repeat: no-repeat'
            ];
            return htmlSafe(styles.join('; '));
        }

        return htmlSafe('');
    }

    @action
    triggerIconFileDialog() {
        let input = document.querySelector('input[type="file"][name="iconImage"]');
        input.click();
    }

    @action
    setIconImage([image]) {
        this.integration.set('iconImage', image.url);
    }

    @action
    save() {
        return this.saveTask.perform();
    }

    @action
    toggleUnsavedChangesModal(transition) {
        let leaveTransition = this.leaveScreenTransition;

        if (!transition && this.showUnsavedChangesModal) {
            this.set('leaveScreenTransition', null);
            this.set('showUnsavedChangesModal', false);
            return;
        }

        if (!leaveTransition || transition.targetName === leaveTransition.targetName) {
            this.set('leaveScreenTransition', transition);

            // if a save is running, wait for it to finish then transition
            if (this.save.isRunning) {
                return this.save.last.then(() => {
                    transition.retry();
                });
            }

            // we genuinely have unsaved data, show the modal
            this.set('showUnsavedChangesModal', true);
        }
    }

    @action
    leaveScreen() {
        let transition = this.leaveScreenTransition;

        if (!transition) {
            this.notifications.showAlert('Sorry, there was an error in the application. Please let the Ghost team know what happened.', {type: 'error'});
            return;
        }

        // roll back changes on model props
        this.integration.rollbackAttributes();

        return transition.retry();
    }

    @action
    deleteIntegration() {
        this.integration.destroyRecord();
    }

    @action
    confirmIntegrationDeletion() {
        this.set('showDeleteIntegrationModal', true);
    }

    @action
    cancelIntegrationDeletion() {
        this.set('showDeleteIntegrationModal', false);
    }

    @action
    confirmWebhookDeletion(webhook) {
        this.set('webhookToDelete', webhook);
    }

    @action
    cancelWebhookDeletion() {
        this.set('webhookToDelete', null);
    }

    @action
    deleteWebhook() {
        return this.webhookToDelete.destroyRecord();
    }

    @task
    *saveTask() {
        return yield this.integration.save();
    }

    @task
    *copyContentKey() {
        copyTextToClipboard(this.integration.contentKey.secret);
        yield timeout(3000);
    }

    @task
    *copyAdminKey() {
        copyTextToClipboard(this.integration.adminKey.secret);
        yield timeout(3000);
    }

    @task
    *copyApiUrl() {
        copyTextToClipboard(this.apiUrl);
        yield timeout(3000);
    }
}
