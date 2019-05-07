import ModalComponent from 'ghost-admin/components/modal-base';
import ghostPaths from 'ghost-admin/utils/ghost-paths';
import {
    UnsupportedMediaTypeError,
    isThemeValidationError,
    isUnsupportedMediaTypeError,
    isVersionMismatchError
} from 'ghost-admin/services/ajax';
import {computed} from '@ember/object';
import {get} from '@ember/object';
import {mapBy, or} from '@ember/object/computed';
import {inject as service} from '@ember/service';

const DEFAULTS = {
    accept: ['application/zip', 'application/x-zip-compressed'],
    extensions: ['zip']
};

export default ModalComponent.extend({
    store: service(),

    accept: null,
    extensions: null,
    themes: null,
    closeDisabled: false,
    file: null,
    theme: false,
    displayOverwriteWarning: false,

    hideUploader: or('theme', 'displayOverwriteWarning'),
    currentThemeNames: mapBy('model.themes', 'name'),

    uploadUrl: computed(function () {
        return `${ghostPaths().apiRoot}/themes/upload/`;
    }),

    themeName: computed('theme.{name,package.name}', function () {
        let themePackage = this.get('theme.package');
        let name = this.get('theme.name');

        return themePackage ? `${themePackage.name} - ${themePackage.version}` : name;
    }),

    fileThemeName: computed('file', function () {
        let file = this.file;
        return file.name.replace(/\.zip$/, '');
    }),

    canActivateTheme: computed('theme', function () {
        let theme = this.theme;
        return theme && !theme.get('active');
    }),

    init() {
        this._super(...arguments);

        this.accept = this.accept || DEFAULTS.accept;
        this.extensions = this.extensions || DEFAULTS.extensions;
    },

    actions: {
        validateTheme(file) {
            let themeName = file.name.replace(/\.zip$/, '').replace(/[^\w@.]/gi, '-').toLowerCase();

            let currentThemeNames = this.currentThemeNames;

            this.set('file', file);

            let [, extension] = (/(?:\.([^.]+))?$/).exec(file.name);
            let extensions = this.extensions;

            if (!extension || extensions.indexOf(extension.toLowerCase()) === -1) {
                return new UnsupportedMediaTypeError();
            }

            if (file.name.match(/^casper\.zip$/i)) {
                return {payload: {errors: [{message: 'Sorry, the default Casper theme cannot be overwritten.<br>Please rename your zip file and try again.'}]}};
            }

            if (!this._allowOverwrite && currentThemeNames.includes(themeName)) {
                this.set('displayOverwriteWarning', true);
                this.set('overwriteFiles', [file]);
                return false;
            }

            return true;
        },

        confirmOverwrite() {
            this._allowOverwrite = true;
            this.set('displayOverwriteWarning', false);
        },

        uploadStarted() {
            this.set('closeDisabled', true);
        },

        uploadSuccess([{response} = {}]) {
            this.set('closeDisabled', false);

            // <GhUploader> calls onComplete even when the upload fails
            if (!response) {
                return;
            }

            this.store.pushPayload(response);

            let theme = this.store.peekRecord('theme', response.themes[0].name);

            this.set('theme', theme);

            if (get(theme, 'warnings.length') > 0) {
                this.set('validationWarnings', get(theme, 'warnings'));
            }

            // Ghost differentiates between errors and fatal errors
            // You can't activate a theme with fatal errors, but with errors.
            if (get(theme, 'errors.length') > 0) {
                this.set('validationErrors', get(theme, 'errors'));
            }

            this.set('hasWarningsOrErrors', this.get('validationErrors.length') || this.get('validationWarnings.length'));
        },

        uploadFailed([{error}]) {
            this.set('closeDisabled', false);

            if (!error) {
                return;
            }

            if (isVersionMismatchError(error)) {
                this.notifications.showAPIError(error);
                return;
            }

            if (isUnsupportedMediaTypeError(error)) {
                this.set('uploadError', `The file type you uploaded is not supported. Please use .${this.extensions.join(', .')}`);
                return;
            }

            if (isThemeValidationError(error)) {
                let errors = error.payload.errors[0].details.errors;
                let fatalErrors = [];
                let normalErrors = [];

                // to have a proper grouping of fatal errors and none fatal, we need to check
                // our errors for the fatal property
                if (errors && errors.length > 0) {
                    for (let i = 0; i < errors.length; i += 1) {
                        if (errors[i].fatal) {
                            fatalErrors.push(errors[i]);
                        } else {
                            normalErrors.push(errors[i]);
                        }
                    }
                }

                this.set('fatalValidationErrors', fatalErrors);
                this.set('validationErrors', normalErrors);
            } else {
                if (error.payload && error.payload.errors) {
                    let [payloadError] = error.payload.errors;
                    this.set('uploadError', payloadError.context || payloadError.message);
                } else {
                    this.set('uploadError', error.message);
                }
            }
        },

        confirm() {
            // noop - we don't want the enter key doing anything
        },

        activate() {
            this.get('model.activate')(this.theme);
            this.closeModal();
        },

        closeModal() {
            if (!this.closeDisabled) {
                this._super(...arguments);
            }
        },

        reset() {
            this.set('theme', null);
            this.set('validationWarnings', []);
            this.set('validationErrors', []);
            this.set('fatalValidationErrors', []);
            this.set('hasWarningsOrErrors', false);
            this.set('overwriteFiles', null);
            this.set('uploadError', null);
        }
    }
});
