import Component from '@glimmer/component';
import MemberImportError from 'ghost-admin/errors/member-import-error';
import papaparse from 'papaparse';
import {action} from '@ember/object';
import {tracked} from '@glimmer/tracking';

export default class CsvFileMapping extends Component {
    @tracked
    error = null;

    @tracked
    fileData = null;

    @tracked
    showErrors = false;

    mappingResult = {};

    constructor(...args) {
        super(...args);
        this.parseFileAndGenerateMapping(this.args.file);
        this.showErrors = this.args.showErrors;
    }

    parseFileAndGenerateMapping(file) {
        papaparse.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
                if (result.data && result.data.length) {
                    this.fileData = result.data;
                } else {
                    this.fileData = [];
                }
            }
        });
    }

    @action
    setMapping(mapping) {
        if (this.fileData.length === 0) {
            this.error = new MemberImportError({
                message: 'File is empty, nothing to import. Please select a different file.'
            });
        } else if (!mapping.getKeyByValue('email')) {
            this.error = new MemberImportError({
                message: 'Please map "Email" to one of the fields in the CSV.'
            });
        } else {
            this.error = null;
        }

        if (this.error) {
            this.setMappingResult(this.error);
            return;
        }
        this.mapping = mapping;
        this.setMappingResult();
    }

    @action
    updateLabels(labels) {
        this.labels = labels;
        this.setMappingResult();
    }

    setMappingResult(error) {
        this.args.setMappingResult({
            mapping: this.mapping,
            labels: this.labels,
            membersCount: this.fileData?.length,
            error: (error || null)
        });
    }
}
