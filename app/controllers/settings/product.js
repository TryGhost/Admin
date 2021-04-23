import Controller from '@ember/controller';
import EmberObject, {action} from '@ember/object';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency-decorators';
import {tracked} from '@glimmer/tracking';

export default class ProductController extends Controller {
    @service settings;

    @tracked showLeaveSettingsModal = false;
    @tracked showPriceModal = false;
    @tracked priceModel = null;

    get product() {
        return this.model;
    }

    get stripePrices() {
        const stripePrices = this.model.stripePrices || [];
        return stripePrices.map((d) => {
            return {
                ...d,
                amount: d.amount / 100
            };
        });
    }

    get noOfPrices() {
        return (this.product.stripePrices || []).length;
    }

    leaveRoute(transition) {
        if (this.settings.get('hasDirtyAttributes')) {
            transition.abort();
            this.leaveSettingsTransition = transition;
            this.showLeaveSettingsModal = true;
        }
    }

    @action
    async openEditPrice(price) {
        this.priceModel = price;
        this.showPriceModal = true;
    }

    @action
    async openNewPrice() {
        this.priceModel = null;
        this.showPriceModal = true;
    }

    @action
    async confirmLeave() {
        this.settings.rollbackAttributes();
        this.showLeaveSettingsModal = false;
        this.leaveSettingsTransition.retry();
    }

    @action
    cancelLeave() {
        this.showLeaveSettingsModal = false;
        this.leaveSettingsTransition = null;
    }

    @action
    savePrice(price) {
        const stripePrices = this.product.stripePrices.map((d) => {
            if (d.id === price.id) {
                return EmberObject.create(price);
            }
            return d;
        });
        this.product.set('stripePrices', stripePrices);
        this.saveTask.perform();
    }

    @action
    closePriceModal() {
        this.showPriceModal = false;
    }

    @task({drop: true})
    *saveTask() {
        return yield this.product.save();
    }
}
