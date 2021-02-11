import ModalBase from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency-decorators';
import {tracked} from '@glimmer/tracking';

// TODO: update modals to work fully with Glimmer components
@classic
export default class ModalInstallThemeComponent extends ModalBase {
    @service ajax;
    @service ghostPaths;
    @service store;

    @tracked model;
    @tracked theme;
    @tracked validationErrors = [];
    @tracked fatalValidationErrors = [];

    get themeName() {
        return this.model.ref.split('/')[1];
    }

    get currentThemeNames() {
        return this.model.themes.mapBy('name');
    }

    get willOverwriteDefault() {
        return this.themeName.toLowerCase() === 'casper';
    }

    get willOverwrite() {
        return this.model.themes.findBy('name', this.themeName.toLowerCase());
    }

    get installSuccess() {
        return !!this.theme;
    }

    get shouldShowInstall() {
        return !this.installSuccess && !this.willOverwriteDefault;
    }

    get shouldShowActivate() {
        return this.installSuccess && !this.theme.active;
    }

    get hasActionButton() {
        return this.shouldShowInstall || this.shouldShowActivate;
    }

    @action
    close() {
        this.closeModal();
    }

    actions = {
        confirm() {
            // noop - needed to override ModalBase.actions.confirm
        },

        // needed because ModalBase uses .send() for keyboard events
        closeModal() {
            this.closeModal();
        }
    }

    @task({drop: true})
    *installTask() {
        // TODO: update API to use PUT/POST
        const url = this.ghostPaths.url.api('themes/install') + `?source=github&ref=${this.model.ref}`;
        const result = yield this.ajax.request(url);

        if (result.themes) {
            // show theme in list immediately
            this.store.pushPayload(result);

            this.theme = this.store.peekRecord('theme', result.themes[0].name);

            return true;
        }
    }

    @task({drop: true})
    *activateTask() {
        yield this.theme.activate();
        this.closeModal();
    }
}
