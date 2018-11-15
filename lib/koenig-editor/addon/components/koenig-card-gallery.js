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
        // 3 images per row unless last row would have a single image in which
        // case the last 2 rows will have 2 images
        let maxImagesInRow = function (idx) {
            return noOfImages > 1 && (noOfImages % 3 === 1) && (idx === (noOfImages - 2));
        };

        this.images.forEach((image, idx) => {
            let row = image.row;
            let classes = ['relative', 'hide-child'];

            // start a new display row if necessary
            if (maxImagesInRow(idx)) {
                row = row + 1;
            }

            // apply classes to the image containers
            if (!rows[row]) {
                // first image in row
                rows[row] = [];
                classes.push('mr2');
            } else if (((idx + 1) % 3 === 0) || maxImagesInRow(idx + 1) || idx + 1 === noOfImages) {
                // last image in row
                classes.push('ml2');
            } else {
                // middle of row
                classes.push('ml2', 'mr2');
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

            let image = event.target.querySelector('img');
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

        // dragOver(event) {
        //     event.preventDefault();
        //     console.log('dragOver', event);
        // },

        dragEnd(event) {
            this.set('isReordingImages', false);
            event.target.style.opacity = '';

            document.getElementById('gallery-drag-image').remove();

            console.log('dragEnd', event);
        }
    },

    // Ember event handlers ----------------------------------------------------

    mouseMove(event) {
        let lastImage = this._image;
        this._image = event.target;

        if (this._image.matches('[data-image]')) {
            let imageRects = this._image.getBoundingClientRect();
            let midX = imageRects.x + imageRects.width / 2;
            let lastRow = this._row;
            let lastSide = this._side;

            let dropIndicator = this.element.querySelector('[data-drop-indicator]');
            if (!dropIndicator) {
                dropIndicator = document.createElement('div');
                dropIndicator.dataset.dropIndicator = true;
                dropIndicator.classList.add('bg-blue');
                dropIndicator.style.position = 'absolute';
                dropIndicator.style.pointerEvents = 'none';
                dropIndicator.style.opacity = 0;
                dropIndicator.style.width = '4px';
                dropIndicator.style.height = 0;
                dropIndicator.style.zIndex = 100000;

                let relative = this.element.querySelector('.relative');
                relative.appendChild(dropIndicator);
            }

            this._row = this._image.closest('[data-row]');

            if (event.clientX < midX) {
                this._side = 'left';
            } else if (event.clientX >= midX) {
                this._side = 'right';
            }

            if (this._row !== lastRow || this._image !== lastImage || this._side !== lastSide) {
                // cancel any current indicator show timeout
                run.cancel(this._indicatorTimeout);

                // remove any transforms on previously transformed row
                // TODO: keep track of transformed items separately
                if (lastRow) {
                    lastRow.querySelectorAll('[data-image]').forEach((image) => {
                        image.style.transform = '';
                        image.style.transitionDuration = '250ms';
                    });
                }

                if (this._row) {
                    let rowImages = Array.from(this._row.querySelectorAll('[data-image]'));
                    let curIndex = rowImages.indexOf(this._image);

                    rowImages.forEach((rowImage, index) => {
                        if (index < curIndex || index === curIndex && this._side === 'right') {
                            rowImage.style.transform = 'translate3d(-30px, 0, 0)';
                            rowImage.style.transitionDuration = '250ms';
                        } else {
                            rowImage.style.transform = 'translate3d(30px, 0, 0)';
                            rowImage.style.transitionDuration = '250ms';
                        }

                        // position drop indicator
                        // TODO: get non-transformed positions at beginning so that we can
                        // position the indicator correctly. Would need to re-calculate on resize
                        // TODO: wait for transform transition to end
                        if (curIndex === index) {
                            // 30px minus half of indicator width
                            let leftAdjustment = 0;
                            let imageStyles = getComputedStyle(this._image);
                            let imageRect = this._image.getBoundingClientRect();

                            if (this._side === 'left') {
                                leftAdjustment -= parseInt(imageStyles.marginLeft);
                            } else if (this._side === 'right') {
                                leftAdjustment += Math.round(imageRect.width)
                                    + parseInt(imageStyles.marginRight);
                            }

                            // account for indicator width
                            leftAdjustment -= 2;

                            let lastLeft = parseInt(dropIndicator.style.left);
                            let lastTop = parseInt(dropIndicator.style.top);
                            let newLeft = this._image.offsetLeft + leftAdjustment;
                            let newTop = this._image.offsetTop;
                            let newHeight = this._image.offsetHeight;

                            // if indicator hasn't moved, keep it showing, otherwise
                            // wait for the transitions to almost finish before
                            // re-positioning and showing
                            // NOTE: +- 1px is due to sub-pixel positioning of images
                            if (newTop === lastTop && newLeft >= lastLeft - 1 && newLeft <= lastLeft + 1) {
                                dropIndicator.style.opacity = 1;
                            } else {
                                dropIndicator.style.opacity = 0;

                                this._indicatorTimeout = run.later(this, function () {
                                    dropIndicator.style.height = `${newHeight}px`;
                                    dropIndicator.style.left = `${newLeft}px`;
                                    dropIndicator.style.top = `${newTop}px`;
                                    dropIndicator.style.opacity = 1;
                                }, 150);
                            }
                        }
                    });
                }
            }
        }
    },

    mouseLeave() {
        // reset all image transforms
        this.element.querySelectorAll('[data-image]').forEach((image) => {
            image.style.transform = '';
        });

        // hide drop indicator
        let indicator = this.element.querySelector('[data-drop-indicator]');
        if (indicator) {
            indicator.style.opacity = 0;
            indicator.style.left = `${-1000}px`;
        }
    },

    dragOver(event) {
        if (!event.dataTransfer || this.isReordingImages) {
            console.log('dragOver ignore', event);
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
