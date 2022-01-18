import Component from '@glimmer/component';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';

export default class SettingsDefaultEmailRecipientsComponent extends Component {
    @service settings;

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
            value: 'invite',
            icon: 'members-all',
            icon_color: 'blue'
        }, {
            name: 'Paid-members only',
            description: 'People who have a premium subscription',
            value: 'none',
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
        }, {
            name: 'Disable completely',
            description: 'Posts cannot be sent by email, deactivate newsletter features',
            value: 'disabled',
            icon: 'no-email',
            icon_color: 'red'
        }];
    }

    get selectedOption() {
        return this.options.find(o => o.value === this.settings.get('membersSignupAccess'));
    }

    @action
    setDefaultEmailRecipients(option) {
        if (['disabled', 'visibility'].includes(option.value)) {
            this.settings.set('editorDefaultEmailRecipients', option.value);
            return;
        }

        if (option.value === 'none') {
            this.settings.set('editorDefaultEmailRecipientsFilter', null);
        }

        this.settings.set('editorDefaultEmailRecipients', 'filter');
    }

    @action
    setSignupAccess(option) {
        this.settings.set('membersSignupAccess', option.value);
        this.args.onChange?.(option.value);

        if (option.value === 'none') {
            this.settings.set('defaultContentVisibility', 'public');
        }
    }
}
