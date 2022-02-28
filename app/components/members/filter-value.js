import Component from '@glimmer/component';
import {action} from '@ember/object';
import {tracked} from '@glimmer/tracking';

const FILTER_OPTIONS = {
    subscriptionPriceInterval: [
        {label: 'Monthly', name: 'month'},
        {label: 'Yearly', name: 'year'}
    ],
    status: [
        {label: 'Paid', name: 'paid'},
        {label: 'Free', name: 'free'},
        {label: 'Complimentary', name: 'comped'}
    ],
    subscribed: [
        {label: 'Subscribed', name: 'true'},
        {label: 'Unsubscribed', name: 'false'}
    ],
    subscriptionStripeStatus: [
        {label: 'Active', name: 'active'},
        {label: 'Trialing', name: 'trialing'},
        {label: 'Canceled', name: 'canceled'},
        {label: 'Unpaid', name: 'unpaid'},
        {label: 'Past Due', name: 'past_due'},
        {label: 'Incomplete', name: 'incomplete'},
        {label: 'Incomplete - Expired', name: 'incomplete_expired'}
    ]
};

export default class MembersFilterValue extends Component {
    @tracked filterValue;

    constructor(...args) {
        super(...args);
        this.availableFilterOptions = FILTER_OPTIONS;
        this.filterValue = this.args.filter.value;
    }

    get productFilterValue() {
        if (this.args.filter?.type === 'product') {
            const tiers = this.args.filter?.value || [];
            return tiers.map((tier) => {
                return {
                    slug: tier
                };
            });
        }
        return [];
    }

    @action
    setInputFilterValue(filterType, filterId, event) {
        this.filterValue = event.target.value;
    }

    @action
    updateInputFilterValue(filterType, filterId, event) {
        if (event.type === 'blur') {
            this.filterValue = event.target.value;
        }
        this.args.setFilterValue(filterType, filterId, this.filterValue);
    }

    @action
    updateInputFilterValueOnEnter(filterType, filterId, event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.args.setFilterValue(filterType, filterId, this.filterValue);
        }
    }

    @action
    setLabelsFilterValue(filterType, filterId, labels) {
        this.args.setFilterValue(filterType, filterId, labels.map(label => label.slug));
    }

    @action
    setProductsFilterValue(filterType, filterId, tiers) {
        this.args.setFilterValue(filterType, filterId, tiers.map(tier => tier.slug));
    }

    @action
    setFilterValue(filterType, filterId, value) {
        this.args.setFilterValue(filterType, filterId, value);
    }
}
