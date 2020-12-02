import ModalComponent from 'ghost-admin/components/modal-base';
import ghostPaths from 'ghost-admin/utils/ghost-paths';
import unparse from '@tryghost/members-csv/lib/unparse';
import {
    AcceptedResponse,
    isRequestEntityTooLargeError,
    isUnsupportedMediaTypeError,
    isVersionMismatchError
} from 'ghost-admin/services/ajax';
import {computed} from '@ember/object';
import {htmlSafe} from '@ember/string';
import {isBlank} from '@ember/utils';
import {inject as service} from '@ember/service';

export default ModalComponent.extend({
    config: service(),
    ajax: service(),
    notifications: service(),
    store: service(),

    state: 'INIT',

    file: null,
    mappingResult: null,
    paramName: 'membersfile',
    importResponse: null,
    errorMessage: null,

    // Allowed actions
    confirm: () => {},

    uploadUrl: computed(function () {
        return `${ghostPaths().apiRoot}/members/upload/`;
    }),

    importDisabled: computed('mappingResult', function () {
        return !this.file || !this.mappingResult || !!this.mappingResult.error || !this.mappingResult.membersCount;
    }),

    formData: computed('file', function () {
        let formData = new FormData();

        formData.append(this.paramName, this.file);

        if (this.mappingResult.labels) {
            this.mappingResult.labels.forEach((label) => {
                formData.append('labels', label.name);
            });
        }

        if (this.mappingResult.mapping) {
            for (const key in this.mappingResult.mapping.toJSON()) {
                if (this.mappingResult.mapping.get(key)) {
                    // reversing mapping direction to match the structure accepted in the API
                    formData.append(`mapping[${this.mappingResult.mapping.get(key)}]`, key);
                }
            }
        }

        return formData;
    }),

    actions: {
        setFile(file) {
            this.set('file', file);
            this.set('state', 'MAPPING');
        },

        setMappingResult(mappingResult) {
            this.set('mappingResult', mappingResult);
        },

        upload() {
            if (this.file && !this.mappingResult.error) {
                this.generateRequest();
            }
        },

        reset() {
            this.set('errorMessage', null);
            this.set('file', null);
            this.set('mapping', null);
            this.set('state', 'INIT');
        },

        closeModal() {
            if (this.state !== 'UPLOADING') {
                this._super(...arguments);
            }
        },

        // noop - we don't want the enter key doing anything
        confirm() {}
    },

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
    },

    _uploadSuccess(importResponse) {
        let importedCount = importResponse.meta.stats.imported;
        const erroredMembers = importResponse.meta.stats.invalid;
        let errorCount = erroredMembers.length;
        const errorList = {};
        erroredMembers.forEach((d) => {
            d.error.split(',').forEach((errorStr) => {
                if (errorList[errorStr]) {
                    errorList[errorStr].count = errorList[errorStr].count + 1;
                } else {
                    errorList[errorStr] = {
                        message: errorStr,
                        count: 1
                    };
                }
            });
        });

        let errorCsv = unparse(importResponse.meta.stats.invalid);
        let errorCsvBlob = new Blob([errorCsv], {type: 'text/csv'});
        let errorCsvUrl = URL.createObjectURL(errorCsvBlob);

        this.set('importResponse', {
            importedCount,
            errorCount,
            errorCsvUrl,
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
    },

    _uploadError(error) {
        let message;

        if (isVersionMismatchError(error)) {
            this.notifications.showAPIError(error);
        }

        if (isUnsupportedMediaTypeError(error)) {
            message = 'The file type you uploaded is not supported.';
        } else if (isRequestEntityTooLargeError(error)) {
            message = 'The file you uploaded was larger than the maximum file size your server allows.';
        } else if (error.payload && error.payload.errors && !isBlank(error.payload.errors[0].message)) {
            message = htmlSafe(error.payload.errors[0].message);
        } else {
            console.error(error); // eslint-disable-line
            message = 'Something went wrong :(';
        }

        this.set('errorMessage', message);
    }
});
