import Component from '@glimmer/component';
import moment from 'moment';
import {action} from '@ember/object';
import {getNonDecimal, getSymbol} from 'ghost-admin/utils/currency';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency-decorators';
import {tracked} from '@glimmer/tracking';

export default class extends Component {
    @service
    membersUtils
    @service
    ghostPaths
    @service
    ajax
    @service
    store
    @service
    feature

    constructor(...args) {
        super(...args);
        this.member = this.args.member;
        this.scratchMember = this.args.scratchMember;
    }

    @tracked
    showMemberProductModal = false;

    get canShowStripeInfo() {
        return !this.member.get('isNew') && this.membersUtils.isStripeEnabled;
    }

    get isAddComplimentaryAllowed() {
        if (!this.membersUtils.isStripeEnabled) {
            return false;
        }

        let products = this.member.get('products');
        if (products && products.length > 0) {
            return false;
        }

        return true;
    }

    get products() {
        let products = this.member.get('products') || [];
        let subscriptions = this.member.get('subscriptions') || [];
        let subscriptionData = subscriptions.filter((sub) => {
            return !!sub.price;
        }).map((sub) => {
            return {
                ...sub,
                startDate: sub.start_date ? moment(sub.start_date).format('D MMM YYYY') : '-',
                validUntil: sub.current_period_end ? moment(sub.current_period_end).format('D MMM YYYY') : '-',
                cancellationReason: sub.cancellation_reason,
                price: {
                    ...sub.price,
                    currencySymbol: getSymbol(sub.price.currency),
                    nonDecimalAmount: getNonDecimal(sub.price.amount)
                },
                isComplimentary: !sub.id
            };
        });

        for (let product of products) {
            let productSubscriptions = subscriptionData.filter((subscription) => {
                if (subscription.status === 'canceled') {
                    return false;
                }
                return subscription?.price?.product?.product_id === product.id;
            });
            product.subscriptions = productSubscriptions;
        }

        return products;
    }

    get customer() {
        let firstSubscription = this.member.get('subscriptions').firstObject;
        let customer = firstSubscription?.customer;

        if (customer) {
            return {
                ...customer,
                startDate: firstSubscription?.startDate
            };
        }
        return null;
    }

    get isCreatingComplimentary() {
        return this.args.isSaveRunning;
    }

    @action
    setProperty(property, value) {
        this.args.setProperty(property, value);
    }

    @action
    setLabels(labels) {
        this.member.set('labels', labels);
    }

    @action
    closeMemberProductModal() {
        this.showMemberProductModal = false;
    }

    @action
    cancelSubscription(subscriptionId) {
        this.cancelSubscriptionTask.perform(subscriptionId);
    }

    @action
    removeComplimentary(productId) {
        this.removeComplimentaryTask.perform(productId);
    }

    @action
    continueSubscription(subscriptionId) {
        this.continueSubscriptionTask.perform(subscriptionId);
    }

    @action
    addCompedSubscription() {
        this.args.setProperty('comped', true);
        this.args.saveMember();
    }

    @task({drop: true})
    *cancelSubscriptionTask(subscriptionId) {
        let url = this.ghostPaths.url.api('members', this.member.get('id'), 'subscriptions', subscriptionId);

        let response = yield this.ajax.put(url, {
            data: {
                cancel_at_period_end: true
            }
        });

        this.store.pushPayload('member', response);
        return response;
    }

    @task({drop: true})
    *removeComplimentaryTask(productId) {
        let url = this.ghostPaths.url.api(`members/${this.member.get('id')}`);
        let products = this.member.get('products') || [];
        const updatedProducts = products.filter(product => product.id !== productId).map(product => ({id: product.id}));

        let response = yield this.ajax.put(url, {
            data: {
                members: [{
                    id: this.member.get('id'),
                    email: this.member.get('email'),
                    products: updatedProducts
                }]
            }
        });

        this.store.pushPayload('member', response);
        return response;
    }

    @task({drop: true})
    *continueSubscriptionTask(subscriptionId) {
        let url = this.ghostPaths.url.api('members', this.member.get('id'), 'subscriptions', subscriptionId);

        let response = yield this.ajax.put(url, {
            data: {
                cancel_at_period_end: false
            }
        });

        this.store.pushPayload('member', response);
        return response;
    }
}
