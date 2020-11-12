import ModalComponent from 'ghost-admin/components/modal-base';
import {computed} from '@ember/object';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default ModalComponent.extend({
    settings: service(),
    koenigUi: service(),

    showHeader: true,
    showSansSerif: false,
    showBadge: true,
    isFocused: false,
    placeholder: 'Footer...',
    update() {},
    newsletterFooterHtml: computed('settings.newsletterFooterHtml', function () {
        return this.settings.get('newsletterFooterHtml') || '';
    }),

    init() {
        this._super(...arguments);
    },

    actions: {
        toggleShowHeader(showHeader) {
            this.settings.set('newsletterShowHeader', showHeader);
        },

        setTypography(typography) {
            if (typography === 'serif') {
                this.settings.set('newsletterBodyFontCategory', 'serif');
            } else {
                this.settings.set('newsletterBodyFontCategory', 'sans_serif');
            }
        },

        toggleBadge(showBadge) {
            this.settings.set('newsletterShowBadge', showBadge);
        },

        confirm() {
            return this.saveTask.perform();
        },

        leaveSettings() {
            this.closeModal();
        },

        update(newHtml) {
            this.settings.set('newsletterFooterHtml', newHtml);
        },

        handleEnter(...args) {
            console.log('enter');
            console.log(...args);
        },

        registerEditor(editor) {
            this.editor = editor;
            window.editor = editor;
            console.log(editor);
        }
    },

    focusIn() {
        this.koenigUi.captionGainedFocus(this);
    },

    focusOut() {
        this.koenigUi.captionLostFocus(this);
    },

    saveTask: task(function* () {
        yield this.settings.save();
        this.closeModal();
    }).drop()
});
