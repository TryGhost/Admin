import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import ghostPaths from 'ghost-admin/utils/ghost-paths';
import moment from 'moment';
import unparse from '@tryghost/members-csv/lib/unparse';
import {
    AcceptedResponse,
    isRequestEntityTooLargeError,
    isUnsupportedMediaTypeError,
    isVersionMismatchError
} from 'ghost-admin/services/ajax';
import {action, computed} from '@ember/object';
import {htmlSafe} from '@ember/template';
import {isBlank} from '@ember/utils';
import {inject as service} from '@ember/service';

@classic
export default class ModalImportMembers extends ModalComponent {
    @service
    config;

    @service
    ajax;

    @service
    notifications;

    @service
    store;

    state = 'INIT';
    file = null;
    mappingResult = null;
    mappingFileData = null;
    paramName = 'membersfile';
    importResponse = null;
    errorMessage = null;
    errorHeader = null;
    showMappingErrors = false;
    showTryAgainButton = true;

    // Allowed actions
    confirm = () => {};

    @computed
    get uploadUrl() {
        return `${ghostPaths().apiRoot}/members/upload/`;
    }

    @computed('file')
    get formData() {
        let formData = new FormData();

        formData.append(this.paramName, this.file);

        if (this.mappingResult.labels) {
            this.mappingResult.labels.forEach((label) => {
                formData.append('labels', label.name);
            });
        }

        if (this.mappingResult.mapping) {
            let mapping = this.mappingResult.mapping.toJSON();
            for (let [key, val] of Object.entries(mapping)) {
                formData.append(`mapping[${key}]`, val);
            }
        }

        return formData;
    }

    @action
    setFile(file) {
        this.set('file', file);
        this.set('state', 'MAPPING');
    }

    @action
    setMappingResult(mappingResult) {
        this.set('mappingResult', mappingResult);
    }

    @action
    setMappingFileData(mappingFileData) {
        this.set('mappingFileData', mappingFileData);
    }

    @action
    upload() {
        if (this.file && !this.mappingResult.error) {
            this.generateRequest();
            this.set('showMappingErrors', false);
        } else {
            this.set('showMappingErrors', true);
        }
    }

    @action
    reset() {
        this.set('showMappingErrors', false);
        this.set('errorMessage', null);
        this.set('errorHeader', null);
        this.set('file', null);
        this.set('mapping', null);
        this.set('state', 'INIT');
        this.set('showTryAgainButton', true);
    }

    @action
    closeModal() {
        if (this.state !== 'UPLOADING') {
            // TODO: This call to super is within an action, and has to refer to the parent
            // class's actions to be safe. This should be refactored to call a normal method
            // on the parent class. If the parent class has not been converted to native
            // classes, it may need to be refactored as well. See
            // https: //github.com/scalvert/ember-native-class-codemod/blob/master/README.md
            // for more details.
            super.actions.closeModal.call(this, ...arguments);
        }
    }

    // noop - we don't want the enter key doing anything
    @action
    confirm() {}

    generateRequest() {
        let ajax = this.ajax;
        let formData = this.formData;
        let url = this.uploadUrl;

        this.set('state', 'UPLOADING');
        ajax.post(url, {
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'text'
        }).then((importResponse) => {
            if (importResponse instanceof AcceptedResponse) {
                this.set('state', 'PROCESSING');
            } else {
                this._uploadSuccess(JSON.parse(importResponse));
                this.set('state', 'COMPLETE');
            }
        }).catch((error) => {
            this._uploadError(error);
            this.set('state', 'ERROR');
        });
    }

    _uploadSuccess(importResponse) {
        let importedCount = importResponse.meta.stats.imported;
        const erroredMembers = importResponse.meta.stats.invalid;
        let errorCount = erroredMembers.length;
        const errorList = {};

        const errorsWithFormattedMessages = erroredMembers.map((row) => {
            const formattedError = row.error
                .replace(
                    'Value in [members.email] cannot be blank.',
                    'Missing email address'
                )
                .replace(
                    'Value in [members.note] exceeds maximum length of 2000 characters.',
                    'Note is too long'
                )
                .replace(
                    'Value in [members.subscribed] must be one of true, false, 0 or 1.',
                    'Value of "Subscribed to emails" must be "true" or "false"'
                )
                .replace(
                    'Validation (isEmail) failed for email',
                    'Invalid email address'
                )
                .replace(
                    /No such customer:[^,]*/,
                    'Could not find Stripe customer'
                );
            formattedError.split(',').forEach((errorMssg) => {
                if (errorList[errorMssg]) {
                    errorList[errorMssg].count = errorList[errorMssg].count + 1;
                } else {
                    errorList[errorMssg] = {
                        message: errorMssg,
                        count: 1
                    };
                }
            });
            return {
                ...row,
                error: formattedError
            };
        });

        let errorCsv = unparse(errorsWithFormattedMessages);
        let errorCsvBlob = new Blob([errorCsv], {type: 'text/csv'});
        let errorCsvUrl = URL.createObjectURL(errorCsvBlob);
        let errorCsvName = importResponse.meta.import_label ? `${importResponse.meta.import_label.name} - Errors.csv` : `Import ${moment().format('YYYY-MM-DD HH:mm')} - Errors.csv`;

        this.set('importResponse', {
            importedCount,
            errorCount,
            errorCsvUrl,
            errorCsvName,
            errorList: Object.values(errorList)
        });

        // insert auto-created import label into store immediately if present
        // ready for filtering the members list
        if (importResponse.meta.import_label) {
            this.store.pushPayload({
                labels: [importResponse.meta.import_label]
            });
        }

        // invoke the passed in confirm action to refresh member data
        // @TODO wtf does confirm mean?
        this.confirm({label: importResponse.meta.import_label});
    }

    _uploadError(error) {
        let message;
        let header = 'Import error';

        if (isVersionMismatchError(error)) {
            this.notifications.showAPIError(error);
        }

        if (isUnsupportedMediaTypeError(error)) {
            message = 'The file type you uploaded is not supported.';
        } else if (isRequestEntityTooLargeError(error)) {
            message = 'The file you uploaded was larger than the maximum file size your server allows.';
        } else if (error.payload && error.payload.errors && !isBlank(error.payload.errors[0].message)) {
            message = htmlSafe(error.payload.errors[0].message);

            if (error.payload.errors[0].message.match(/great deliverability/gi)) {
                header = 'Woah there cowboy, that\'s a big list';
                this.set('showTryAgainButton', false);
                // NOTE: confirm makes sure to refresh the members data in the background
                this.confirm();
            }
        } else {
            console.error(error); // eslint-disable-line
            message = 'Something went wrong :(';
        }

        this.set('errorMessage', message);
        this.set('errorHeader', header);
    }
}
