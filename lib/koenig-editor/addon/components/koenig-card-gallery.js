import $ from 'jquery';
import Component from '@ember/component';
import EmberObject, {computed, set} from '@ember/object';
import countWords, {stripTags} from '../utils/count-words';
import layout from '../templates/components/koenig-card-gallery';
import {
    IMAGE_EXTENSIONS,
    IMAGE_MIME_TYPES
} from 'ghost-admin/components/gh-image-uploader';
import {htmlSafe} from '@ember/string';
import {isEmpty} from '@ember/utils';
import {run} from '@ember/runloop';

const MAX_IMAGES = 9;
const MAX_PER_ROW = 3;

export default Component.extend({
    layout,
    // attrs
    files: null,
    images: null,
    payload: null,
    isSelected: false,
    isEditing: false,
    imageExtensions: IMAGE_EXTENSIONS,
    imageMimeTypes: IMAGE_MIME_TYPES,

    // properties
    errorMessage: null,
    handlesDragDrop: true,

    // closure actions
    selectCard() { },
    deselectCard() { },
    editCard() { },
    saveCard() { },
    deleteCard() { },
    moveCursorToNextSection() { },
    moveCursorToPrevSection() { },
    addParagraphAfterCard() { },
    registerComponent() { },

    counts: computed('payload.{caption,payload.images.[]}', function () {
        let wordCount = 0;
        let imageCount = this.payload.images.length;

        if (this.payload.src) {
            imageCount += 1;
        }

        if (this.payload.caption) {
            wordCount += countWords(stripTags(this.payload.caption));
        }

        return {wordCount, imageCount};
    }),

    toolbar: computed('images.[]', function () {
        let items = [];

        if (!isEmpty(this.images)) {
            items.push({
                title: 'Add images',
                icon: 'koenig/kg-add',
                iconClass: 'fill-white',
                action: run.bind(this, this._triggerFileDialog)
            });
        }

        if (items.length > 0) {
            return {items};
        }
    }),

    imageRows: computed('images.@each.{src,previewSrc,width,height,row}', function () {
        let rows = [];
        let noOfImages = this.images.length;

        this.images.forEach((image, idx) => {
            let row = image.row;
            let classes = ['relative', 'hide-child'];

            if (noOfImages > 1 && (noOfImages % 3 === 1) && (idx === (noOfImages - 2))) {
                row = row + 1;
            }
            if (!rows[row]) {
                rows[row] = [];
            } else {
                classes.push('ml4');
            }

            if (row > 0) {
                classes.push('mt4');
            }

            let styledImage = Object.assign({}, image);
            let aspectRatio = (image.width || 1) / (image.height || 1);
            styledImage.style = htmlSafe(`flex: ${aspectRatio} 1 0%`);
            styledImage.classes = classes.join(' ');

            rows[row].push(styledImage);
        });

        return rows;
    }),

    init() {
        this._super(...arguments);

        if (!this.payload || isEmpty(this.payload.images)) {
            this._updatePayloadAttr('images', []);
        }

        this._buildImages();

        this.registerComponent(this);
    },

    actions: {
        addImage(file) {
            let count = this.images.length + 1;
            let row = Math.ceil(count / MAX_PER_ROW) - 1;

            let image = this._readDataFromImageFile(file);
            image.row = row;
            this.images.pushObject(image);
        },

        setImageSrc(uploadResult) {
            let image = this.images.findBy('fileName', uploadResult.fileName);

            image.set('src', uploadResult.url);

            this._buildAndSaveImagesPayload();
        },

        setFiles(files) {
            this._startUpload(files);
        },

        deleteImage(image) {
            let localImage = this.images.findBy('fileName', image.fileName);
            this.images.removeObject(localImage);
            this.images.forEach((image, idx) => {
                image.set('row', Math.ceil((idx + 1) / MAX_PER_ROW) - 1);
            });

            this._buildAndSaveImagesPayload();
        },

        updateCaption(caption) {
            this._updatePayloadAttr('caption', caption);
        },

        /**
         * Opens a file selection dialog - Triggered by "Upload Image" buttons,
         * searches for the hidden file input within the .gh-setting element
         * containing the clicked button then simulates a click
         * @param  {MouseEvent} event - MouseEvent fired by the button click
         */
        triggerFileDialog(event) {
            this._triggerFileDialog(event);
        },

        uploadFailed(uploadResult) {
            let image = this.images.findBy('fileName', uploadResult.fileName);
            this.images.removeObject(image);

            this._buildAndSaveImagesPayload();
            let fileName = (uploadResult.fileName.length > 20) ? `${uploadResult.fileName.substr(0, 20)}...` : uploadResult.fileName;
            this.set('errorMessage', `${fileName} failed to upload`);
        },
        handleErrors(errors) {
            let errorMssg = ((errors[0] && errors[0].message)) || 'Some images failed to upload';
            this.set('errorMessage', errorMssg);
        },

        clearErrorMessage() {
            this.set('errorMessage', null);
        },

        dragStart(event) {
            this.set('isReordingImages', true);

            let image = event.target;
            let aspectRatio = image.width / image.height;
            let width, height;

            if (image.width > image.height) {
                width = 200;
                height = 200 / aspectRatio;
            } else {
                width = 200 * aspectRatio;
                height = 200;
            }

            let dragImage = document.createElement('img');
            dragImage.width = width;
            dragImage.height = height;
            dragImage.id = 'gallery-drag-image';
            dragImage.src = image.src;
            dragImage.style.position = 'absolute';
            dragImage.style.left = '-100%';
            document.body.appendChild(dragImage);

            event.dataTransfer.setDragImage(dragImage, 0, 0);

            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('Text', event.target.src);
            event.target.style.opacity = 0.5;

            // prevent card/editor drag handlers getting involved
            event.stopImmediatePropagation();
            console.log('dragStart', event);
        },

        dragOver(event) {
            event.preventDefault();
            console.log('dragOver', event);
        },

        dragEnd(event) {
            this.set('isReordingImages', false);
            event.target.style.opacity = '';

            document.getElementById('gallery-drag-image').remove();

            console.log('dragEnd', event);
        }
    },

    // Ember event handlers ----------------------------------------------------

    dragOver(event) {
        if (!event.dataTransfer || this.isReordingImages) {
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
        event.preventDefault();
        this.set('isDraggedOver', false);

        if (event.dataTransfer.files) {
            this._startUpload(event.dataTransfer.files);
        }
    },

    // Private methods ---------------------------------------------------------

    _startUpload(files = []) {
        let currentCount = this.images.length;
        let allowedCount = (MAX_IMAGES - currentCount);

        let strippedFiles = Array.prototype.slice.call(files, 0, allowedCount);
        if (strippedFiles.length < files.length) {
            this.set('errorMessage', 'Galleries are limited to 9 images');
        }
        this.set('files', strippedFiles);
    },

    _readDataFromImageFile(file) {
        let url = URL.createObjectURL(file);
        let image = EmberObject.create({
            fileName: file.name,
            previewSrc: url
        });

        let imageElem = new Image();
        imageElem.onload = () => {
            // update current display images
            image.set('width', imageElem.naturalWidth);
            image.set('height', imageElem.naturalHeight);

            // ensure width/height makes it into the payload images
            this._buildAndSaveImagesPayload();
        };
        imageElem.src = url;

        return image;
    },

    _buildAndSaveImagesPayload() {
        let payloadImages = [];

        let isValidImage = image => image.fileName
                && image.src
                && image.width
                && image.height;

        this.images.forEach((image, idx) => {
            if (isValidImage(image)) {
                let payloadImage = Object.assign({}, image, {previewSrc: undefined});
                payloadImage.row = Math.ceil((idx + 1) / MAX_PER_ROW) - 1;

                payloadImages.push(payloadImage);
            }
        });

        this._updatePayloadAttr('images', payloadImages);
    },

    _buildImages() {
        this.images = this.payload.images.map(image => EmberObject.create(image));
    },

    _updatePayloadAttr(attr, value) {
        let payload = this.payload;
        let save = this.saveCard;

        set(payload, attr, value);

        // update the mobiledoc and stay in edit mode
        save(payload, false);
    },

    _triggerFileDialog(event) {
        let target = event && event.target || this.element;

        // simulate click to open file dialog
        // using jQuery because IE11 doesn't support MouseEvent
        $(target)
            .closest('.__mobiledoc-card')
            .find('input[type="file"]')
            .click();
    }
});
