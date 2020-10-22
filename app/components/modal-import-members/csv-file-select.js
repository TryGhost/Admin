import Component from '@ember/component';
import {UnsupportedMediaTypeError} from 'ghost-admin/services/ajax';

export default Component.extend({
    labelText: 'Select or drop a CSV file',

    error: null,
    dragClass: null,

    setFile() {},

    actions: {
        fileSelected(fileList) {
            return this.handleFileSelected(fileList);
        }
    },

    handleFileSelected(fileList) {
        let [file] = Array.from(fileList);

        try {
            this._validateFileType(file);
            this.set('error', null);
        } catch (err) {
            this.set('error', err);
            return;
        }

        this.setFile(file);
    },

    dragOver(event) {
        if (!event.dataTransfer) {
            return;
        }

        // this is needed to work around inconsistencies with dropping files
        // from Chrome's downloads bar
        if (navigator.userAgent.indexOf('Chrome') > -1) {
            let eA = event.dataTransfer.effectAllowed;
            event.dataTransfer.dropEffect = (eA === 'move' || eA === 'linkMove') ? 'move' : 'copy';
        }

        event.stopPropagation();
        event.preventDefault();

        this.set('dragClass', '-drag-over');
    },

    dragLeave(event) {
        event.preventDefault();
        this.set('dragClass', null);
    },

    drop(event) {
        event.preventDefault();
        this.set('dragClass', null);
        if (event.dataTransfer.files) {
            this.handleFileSelected(event.dataTransfer.files);
        }
    },

    _validateFileType(file) {
        let [, extension] = (/(?:\.([^.]+))?$/).exec(file.name);

        if (extension.toLowerCase() !== 'csv') {
            throw new UnsupportedMediaTypeError({
                message: 'The file type you uploaded is not supported'
            });
        }

        return true;
    }
});
