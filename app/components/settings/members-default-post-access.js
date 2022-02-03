import Component from '@glimmer/component';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';
import {tracked} from '@glimmer/tracking';

export default class SettingsMembersDefaultPostAccess extends Component {
    @service settings;
    @service feature;
    @tracked showSegmentError;

    get options() {
        const defaultOptions = [{
            name: 'Public',
            description: 'All site visitors to your site, no login required',
            value: 'public',
            icon: 'globe',
            icon_color: 'green'
        }, {
            name: 'Members only',
            description: 'All logged-in members',
            value: 'members',
            icon: 'members-all',
            icon_color: 'blue'
        }, {
            name: 'Paid-members only',
            description: 'Only logged-in members with an active Stripe subscription',
            value: 'paid',
            icon: 'members-paid',
            icon_color: 'pink'
        }];
        if (this.feature.get('multipleProducts')) {
            defaultOptions.push({
                name: 'Specific tier(s)',
                description: 'Members with any of the selected tiers',
                value: 'tiers',
                icon: 'members-segment',
                icon_color: 'yellow'
            });
        }
        return defaultOptions;
    }

    get hasVisibilityFilter() {
        return this.feature.get('multipleProducts') && !['public', 'members', 'paid'].includes(this.settings.get('defaultContentVisibility'));
    }

    get visibilityTiers() {
        const visibilityTiersData = this.settings.get('defaultContentVisibilityTiers');
        return visibilityTiersData.map((id) => {
            return {id};
        });
    }

    get selectedOption() {
        if (this.settings.get('membersSignupAccess') === 'none') {
            return this.options.find(o => o.value === 'public');
        }

        return this.options.find(o => o.value === this.settings.get('defaultContentVisibility'));
    }

    @action
    setVisibility(segment) {
        if (segment) {
            const productIds = segment?.map((product) => {
                return product.id;
            });
            this.settings.set('defaultContentVisibility', 'tiers');
            this.settings.set('defaultContentVisibilityTiers', productIds);
            this.showSegmentError = false;
        } else {
            this.settings.set('defaultContentVisibility', '');
            this.showSegmentError = true;
        }
    }

    @action
    setDefaultContentVisibility(option) {
        if (this.settings.get('membersSignupAccess') !== 'none') {
            this.settings.set('defaultContentVisibility', option.value);
            if (option.value === 'tiers') {
                this.settings.set('defaultContentVisibilityTiers', []);
            }
        }
    }
}
