import $ from 'jquery';
import Component from '@glimmer/component';
import {
    IMAGE_EXTENSIONS,
    IMAGE_MIME_TYPES
} from 'ghost-admin/components/gh-image-uploader';
import {action} from '@ember/object';
import {utils as ghostHelperUtils} from '@tryghost/helpers';
import {run} from '@ember/runloop';
import {tracked} from '@glimmer/tracking';

const {countWords} = ghostHelperUtils;

export default class KoenigCardBeforeAfterComponent extends Component {
    @tracked imageWidth;
    files = null;
    selectingFile = false;
    imageMimeTypes = IMAGE_MIME_TYPES;
    imageExtensions = IMAGE_EXTENSIONS;

    get overlayStyle() {
        if (this.args.payload.orientation === 'horizontal') {
            return `width: ${this.args.payload.startingPosition}%`;
        }
        if (this.args.payload.orientation === 'vertical') {
            return `height: ${this.args.payload.startingPosition}%`;
        }
        return null;
    }

    get wordCount() {
        return countWords(this.payload.caption);
    }

    get toolbar() {
        if (this.args.isEditing) {
            return false;
        }

        return {
            items: [{
                buttonClass: 'fw4 flex items-center white',
                icon: 'koenig/kg-edit',
                iconClass: 'fill-white',
                title: 'Edit',
                text: '',
                action: run.bind(this, this.args.editCard)
            }]
        };
    }

    updateImageDimensions() {
        let beforeImage = this.args.payload.beforeImage;
        let afterImage = this.args.payload.afterImage;

        let smallestImageWidth = Math.min(
            beforeImage ? beforeImage.width : Infinity,
            afterImage ? afterImage.width : Infinity
        );

        try {
            this.imageWidth = Math.min(
                smallestImageWidth,
                parseInt(getComputedStyle(this.element).getPropertyValue('width'))
            );
        } catch (err) {
            this.imageWidth = Math.min(
                smallestImageWidth,
                0
            );
        }
    }

    constructor(owner, args) {
        super(owner, args);
        args.registerComponent(this);
        if (!args.payload.orientation) {
            args.payload.orientation = 'horizontal';
        }
        if (!args.payload.cardWidth) {
            args.payload.cardWidth = 'wide';
        }
        if (!args.payload.startingPosition) {
            args.payload.startingPosition = 50;
        }
        if (!args.payload.caption) {
            args.payload.caption = null;
        }
    }

    _triggerFileDialog(event) {
        let target = event && event.target || this.element;

        // simulate click to open file dialog
        // using jQuery because IE11 doesn't support MouseEvent
        $(target)
            .closest('.__mobiledoc-card')
            .find('input[type="file"]')
            .trigger('click');
    }

    setupListeners(element) {
        let observer = new MutationObserver(() => {
            // @TODO Update on specific mutations
            this.updateImageDimensions();
        });
        let config = {attributes: true, childList: true, subtree: true};
        observer.observe(element, config);
        this.updateImageDimensions();
    }

    // required for snippet rects to be calculated - editor reaches in to component,
    // expecting a non-Glimmer component with a .element property
    @action
    registerElement(element) {
        this.element = element;
        this.setupListeners(element);
    }

    @action
    uploadStart(file) {
        // @TODO Handle in progress uploads
        let existingImage = this.args.payload.afterImage || this.args.payload.beforeImage;

        return new Promise((resolve, reject) => {
            let objectURL = URL.createObjectURL(file);
            let image = new Image();
            image.addEventListener('load', () => {
                let id = this.selectingFile;
                this.selectingFile = false;
                let metadata = {
                    aspectRatio: image.naturalWidth / image.naturalHeight,
                    id: id
                };
                if (existingImage) {
                    if (metadata.aspectRatio !== existingImage.aspectRatio) {
                        reject(new Error('Before/After images must have the same aspect ratio'));
                    }
                }
                resolve(metadata);
            });
            image.src = objectURL;
        });
    }

    @action
    uploadSuccess(file, metadata) {
        let image = new Image();
        image.addEventListener('load', () => {
            let imageData = {
                src: file.url,
                aspectRatio: metadata.aspectRatio,
                width: image.naturalWidth,
                height: image.naturalHeight
            };
            let prop = `${metadata.id}Image`;
            this.args.payload[prop] = imageData;
        });
        image.src = file.url;
    }

    @action
    setLayoutWide() {
        this.args.payload.cardWidth = 'wide';
    }

    @action
    setLayoutFull() {
        this.args.payload.cardWidth = 'full';
    }

    @action
    setOrientationHorizontal() {
        this.args.payload.orientation = 'horizontal';
    }

    @action
    setOrientationVertical() {
        this.args.payload.orientation = 'vertical';
    }

    @action
    setStartingPosition(event) {
        this.args.payload.startingPosition = Math.min(100, Math.max(0, parseInt(event.target.value)));
    }

    @action
    removeBeforeImage() {
        this.args.payload.beforeImage = null;
    }

    @action
    selectBeforeImage() {
        this.selectingFile = 'before';
        this._triggerFileDialog();
    }

    @action
    selectAfterImage() {
        this.selectingFile = 'after';
        this._triggerFileDialog();
    }

    @action
    removeAfterImage() {
        this.args.payload.afterImage = null;
    }

    @action
    uploadFailed() {
    }

    @action
    handleErrors() {
    }

    @action
    setCaption(caption) {
        this.args.payload.caption = caption;
    }

    @action
    leaveEditMode() {
        if (this.isEmpty) {
            // afterRender is required to avoid double modification of `isSelected`
            // TODO: see if there's a way to avoid afterRender
            run.scheduleOnce('afterRender', this, this.args.deleteCard);
        }
    }
}
