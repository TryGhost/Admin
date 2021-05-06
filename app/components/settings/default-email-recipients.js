import Component from '@glimmer/component';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';
import {tracked} from '@glimmer/tracking';

export default class SettingsDefaultEmailRecipientsComponent extends Component {
    @service settings;

    @tracked segmentSelected = false;

    get isDisabled() {
        return this.settings.get('membersSignupAccess') === 'none';
    }

    get isDisabledSelected() {
        return this.isDisabled ||
            this.settings.get('defaultEmailRecipients') === 'disabled';
    }

    get isVisibilitySelected() {
        return !this.isDisabled &&
            this.settings.get('defaultEmailRecipients') === 'visibility';
    }

    get isNobodySelected() {
        return !this.isDisabled &&
            !this.segmentSelected &&
            this.settings.get('defaultEmailRecipients') === 'segment' &&
            this.settings.get('defaultEmailRecipientsSegment') === null;
    }

    get isAllSelected() {
        return !this.isDisabled &&
            !this.segmentSelected &&
            this.settings.get('defaultEmailRecipients') === 'segment' &&
            this.settings.get('defaultEmailRecipientsSegment') === 'status:free,status:-free';
    }

    get isFreeSelected() {
        return !this.isDisabled &&
            !this.segmentSelected &&
            this.settings.get('defaultEmailRecipients') === 'segment' &&
            this.settings.get('defaultEmailRecipientsSegment') === 'status:free';
    }

    get isPaidSelected() {
        return !this.isDisabled &&
            !this.segmentSelected &&
            this.settings.get('defaultEmailRecipients') === 'segment' &&
            this.settings.get('defaultEmailRecipientsSegment') === 'status:-free';
    }

    get isSegmentSelected() {
        const isCustomSegment = this.settings.get('defaultEmailRecipients') === 'segment' &&
            !this.isNobodySelected &&
            !this.isAllSelected &&
            !this.isFreeSelected &&
            !this.isPaidSelected;

        return !this.isDisabled && (this.segmentSelected || isCustomSegment);
    }

    @action
    setDefaultEmailRecipients(value) {
        if (['disabled', 'visibility'].includes(value)) {
            this.settings.set('defaultEmailRecipients', value);
            return;
        }

        if (value === 'none') {
            this.settings.set('defaultEmailRecipientsSegment', null);
        }

        if (value === 'all') {
            this.settings.set('defaultEmailRecipientsSegment', 'status:free,status:-free');
        }

        if (value === 'free') {
            this.settings.set('defaultEmailRecipientsSegment', 'status:free');
        }

        if (value === 'paid') {
            this.settings.set('defaultEmailRecipientsSegment', 'status:-free');
        }

        this.settings.set('defaultEmailRecipients', 'segment');
    }
}
