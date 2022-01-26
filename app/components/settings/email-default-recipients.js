import Component from '@glimmer/component';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';
import {tracked} from '@glimmer/tracking';

export default class SettingsDefaultEmailRecipientsComponent extends Component {
    @service settings;

    @tracked newsletterEnabled;
    @tracked segmentSelected;

    get isSegment() {
        return this.segmentSelected || this.settings.get('editorDefaultEmailRecipients') === 'filter' && 
            !['status:free,status:-free', 'status:-free', null].includes(this.settings.get('editorDefaultEmailRecipientsFilter'));
    }

    get isDisabled() {
        return this.settings.get('membersSignupAccess') === 'none';
    }

    get options() {
        return [{
            name: 'Whoever has access to the post',
            description: 'Free posts to everyone, premium posts sent to paid members',
            value: 'visibility',
            icon: 'members-post',
            icon_color: 'green'
        }, {
            name: 'All members',
            description: 'Everyone who is subscribed to newsletter updates, whether free or paid members',
            value: 'all-members',
            icon: 'members-all',
            icon_color: 'blue'
        }, {
            name: 'Paid-members only',
            description: 'People who have a premium subscription',
            value: 'paid-only',
            icon: 'members-paid',
            icon_color: 'pink'
        }, {
            name: 'Specific tier(s)',
            description: 'Only people who have a subscription to a selected tier',
            value: 'segment',
            icon: 'members-segment',
            icon_color: 'yellow'
        }, {
            name: 'Usually nobody',
            description: 'Newsletters are off for new posts, but can be enabled when needed',
            value: 'none',
            icon: 'no-members',
            icon_color: 'midlightgrey-d2'
        }];
    }

    get selectedOption() {
        const defaultEmailRecipients = this.settings.get('editorDefaultEmailRecipients');
        let selected = '';

        if (defaultEmailRecipients === 'filter') {
            const defaultEmailRecipientsFilter = this.settings.get('editorDefaultEmailRecipientsFilter');

            if (defaultEmailRecipientsFilter === 'status:free,status:-free' && !this.segmentSelected) {
                selected = 'all-members';
            } else if (defaultEmailRecipientsFilter === 'status:-free' && !this.segmentSelected) {
                selected = 'paid-only';
            } else if (defaultEmailRecipientsFilter === null && !this.segmentSelected) {
                selected = 'none';
            } else {
                selected = 'segment';
            }
        } else {
            selected = defaultEmailRecipients;
        }
        
        return this.options.find(o => o.value === selected);
    }

    @action
    setDefaultEmailRecipients(option) {
        // Set filter to specific tiers
        if (option.value === 'segment') {
            this.segmentSelected = true;
            this.settings.set('editorDefaultEmailRecipients', 'filter');
            return;
        }

        this.segmentSelected = false;

        if (['visibility', 'disabled'].includes(option.value)) {
            this.settings.set('editorDefaultEmailRecipients', option.value);
            this.settings.set('editorDefaultEmailRecipientsFilter', null);
            return;
        }

        // Set filter to paid + free when all members are selected
        if (option.value === 'all-members') {
            this.settings.set('editorDefaultEmailRecipientsFilter', 'status:free,status:-free');
        }

        // Set filter to paid only
        if (option.value === 'paid-only') {
            this.settings.set('editorDefaultEmailRecipientsFilter', 'status:-free');
        }

        // Set filters to null
        if (option.value === 'none') {
            this.settings.set('editorDefaultEmailRecipientsFilter', null);
        }

        this.settings.set('editorDefaultEmailRecipients', 'filter');
    }

    @action
    setDefaultEmailRecipientsFilter(filter) {
        this.settings.set('editorDefaultEmailRecipientsFilter', filter);
    }
}
