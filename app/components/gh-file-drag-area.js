import Component from '@ember/component';

export default Component.extend({
    disabled: false,
    isDraggedOver: false,

    // closure actions
    onDrop() {},

    dragOver(event) {
        if (!event.dataTransfer || this.disabled) {
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

        this.set('isDraggedOver', true);
    },

    dragLeave(event) {
        event.preventDefault();
        this.set('isDraggedOver', false);
    },

    drop(event) {
        if (this.disabled) {
            return;
        }

        event.preventDefault();
        this.set('isDraggedOver', false);
        if (event.dataTransfer.files) {
            this.onDrop(event.dataTransfer.files);
        }
    }
});
