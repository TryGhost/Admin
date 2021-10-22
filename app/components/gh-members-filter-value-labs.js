import Component from '@glimmer/component';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';
import {tracked} from '@glimmer/tracking';
export default class GhMembersFilterValueLabs extends Component {
    @service intl
    @tracked filterValue;
    constructor(...args) {
        super(...args);
        this.availableFilterOptions = {
            subscriptionPriceInterval: [
                {label: this.intl.t('Manual.JS.Monthly'), name: 'month'},
                {label: this.intl.t('Manual.JS.Yearly'), name: 'year'}
            ],
            status: [
                {label: this.intl.t('Manual.JS.Paid'), name: 'paid'},
                {label: this.intl.t('Manual.JS.Free'), name: 'free'},
                {label: this.intl.t('Manual.JS.Complimentary'), name: 'comped'}
            ],
            subscribed: [
                {label: this.intl.t('Manual.JS.Subscribed'), name: 'true'},
                {label: this.intl.t('Manual.JS.Unsubscribed'), name: 'false'}
            ],
            subscriptionStripeStatus: [
                {label: this.intl.t('Manual.JS.Active'), name: 'active'},
                {label: this.intl.t('Manual.JS.Trialing'), name: 'trialing'},
                {label: this.intl.t('Manual.JS.Canceled'), name: 'canceled'},
                {label: this.intl.t('Manual.JS.Unpaid'), name: 'unpaid'},
                {label: this.intl.t('Manual.JS.Past_Due'), name: 'past_due'},
                {label: this.intl.t('Manual.JS.Incomplete'), name: 'incomplete'},
                {label: this.intl.t('Manual.JS.Incomplete_Expired'), name: 'incomplete_expired'}
            ]
        };
        this.filterValue = this.args.filter.value;
    }

    @action
    setInputFilterValue(filterType, filterId, event) {
        this.filterValue = event.target.value;
    }

    @action
    updateInputFilterValue(filterType, filterId) {
        this.args.setFilterValue(filterType, filterId, this.filterValue);
    }

    @action
    updateInputFilterValueOnEnter(filterType, filterId, event) {
        if (event.keyCode === 13) {
            this.args.setFilterValue(filterType, filterId, this.filterValue);
        }
    }

    @action
    setLabelsFilterValue(filterType, filterId, labels) {
        this.args.setFilterValue(filterType, filterId, labels.map(label => label.slug));
    }

    @action
    setFilterValue(filterType, filterId, value) {
        this.args.setFilterValue(filterType, filterId, value);
    }
}
