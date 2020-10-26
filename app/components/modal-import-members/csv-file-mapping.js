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

    labels = {
        labels: []
    }

    constructor(...args) {
        super(...args);
        this.parseFileAndGenerateMapping(this.args.file);
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
                message: 'No email addresses found in the CSV mapping.'
            });
        } else {
            this.error = null;
        }

        if (this.error) {
            this.args.setMappingResult({error: this.error});
            return;
        }
        this.args.setMappingResult({
            mapping,
            labels: this.labels.labels,
            membersCount: this.fileData?.length
        });
    }
}
