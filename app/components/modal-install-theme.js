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

    @tracked model;
    @tracked validationErrors = [];
    @tracked fatalValidationErrors = [];

    get themeName() {
        return this.model.ref.split('/')[1];
    }

    get willOverwriteDefault() {
        return this.themeName.toLowerCase() === 'casper';
    }

    get currentThemeNames() {
        return this.model.themes.mapBy('name');
    }

    get willOverwrite() {
        return !!this.model.themes.findBy('name', this.themeName.toLowerCase());
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
    *install() {
        // TODO: update API to use PUT/POST
        const url = this.ghostPaths.url.api('themes/install') + `?source=github&ref=${this.model.ref}`;
        const result = yield this.ajax.request(url);

        console.log(result);
    }
}
