import ModalComponent from 'ghost-admin/components/modal-base';
import cajaSanitizers from 'ghost-admin/utils/caja-sanitizers';
import classic from 'ember-classic-decorator';
import {action, computed} from '@ember/object';
import {isEmpty} from '@ember/utils';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

@classic
export default class ModalUploadImage extends ModalComponent {
    @service
    config;

    @service
    notifications;

    model = null;
    url = '';
    newUrl = '';
    _isUploading = false;

    @computed('model.{model,imageProperty}')
    get image() {
        let imageProperty = this.get('model.imageProperty');

        return this.get(`model.model.${imageProperty}`);
    }

    set image(value) {
        let model = this.get('model.model');
        let imageProperty = this.get('model.imageProperty');

        return model.set(imageProperty, value);
    }

    didReceiveAttrs() {
        super.didReceiveAttrs(...arguments);

        let image = this.image;
        this.set('url', image);
        this.set('newUrl', image);
    }

    @action
    fileUploaded(url) {
        this.set('url', url);
        this.set('newUrl', url);
    }

    @action
    removeImage() {
        this.set('url', '');
        this.set('newUrl', '');
    }

    @action
    confirm() {
        this.uploadImage.perform();
    }

    @action
    isUploading() {
        this.toggleProperty('_isUploading');
    }

    // TODO: should validation be handled in the gh-image-uploader component?
    //  pro - consistency everywhere, simplification here
    //  con - difficult if the "save" is happening externally as it does here
    //
    //  maybe it should be handled at the model level?
    //      - automatically present everywhere
    //      - file uploads should always result in valid urls so it should only
    //        affect the url input form
    keyDown() {
        this._setErrorState(false);
    }

    _setErrorState(state) {
        if (state) {
            this.element.querySelector('.url').classList.add('error');
        } else {
            this.element.querySelector('.url').classList.remove('error');
        }
    }

    _validateUrl(url) {
        if (!isEmpty(url) && !cajaSanitizers.url(url)) {
            this._setErrorState(true);
            return {message: 'Image URI is not valid'};
        }

        return true;
    }

    // end validation

    @(task(function* () {
        let model = this.get('model.model');
        let newUrl = this.newUrl;
        let result = this._validateUrl(newUrl);
        let notifications = this.notifications;

        if (result === true) {
            this.set('image', newUrl);

            try {
                yield model.save();
            } catch (e) {
                notifications.showAPIError(e, {key: 'image.upload'});
            } finally {
                this.send('closeModal');
            }
        }
    }).drop())
    uploadImage;
}
