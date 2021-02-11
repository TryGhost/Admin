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

    get willOverwriteDefault() {
        return this.themeName.toLowerCase() === 'casper';
    }

    get currentThemeNames() {
        return this.model.themes.mapBy('name');
    }

    get willOverwrite() {
        return !!this.model.themes.findBy('name', this.themeName.toLowerCase());
    }

    get installSuccess() {
        return !!this.theme;
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

        if (result.themes) {
            const [theme] = result.themes;

            this.theme = theme;

            // show theme in list immediately
            this.store.pushPayload(result);

            // deactivate any other active themes
            // (this happens on the server but we only get the active theme back so we need to do this manually)
            if (theme.active) {
                const activeThemes = this.store.peekAll('theme').filterBy('active', true);
                activeThemes.forEach((themeModel) => {
                    if (themeModel.name !== theme.name) {
                        // store.push is necessary to avoid dirty records that cause
                        // problems when we get new data back in subsequent requests
                        this.store.push({data: {
                            id: themeModel.id,
                            type: 'theme',
                            attributes: {active: false}
                        }});
                    }
                });
            }
        }
    }
}
