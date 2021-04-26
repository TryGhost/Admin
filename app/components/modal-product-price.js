import ModalBase from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {task} from 'ember-concurrency-decorators';
import {tracked} from '@glimmer/tracking';

// TODO: update modals to work fully with Glimmer components
@classic
export default class ModalProductPrice extends ModalBase {
    @tracked model;
    @tracked scratchNickname;

    init() {
        super.init(...arguments);
        this.price = {
            ...(this.model.price || {})
        };
    }

    get title() {
        if (this.isExistingPrice) {
            return `Price - ${this.price.nickname || 'No Name'}`;
        }
        return 'New Price';
    }

    get isExistingPrice() {
        return !!this.model.price;
    }

    // TODO: rename to confirm() when modals have full Glimmer support
    @action
    confirmAction() {
        this.confirm(this.price);
        this.close();
    }

    @action
    close(event) {
        event?.preventDefault?.();
        this.closeModal();
    }

    @task({drop: true})
    *savePrice() {
        try {
            const priceObj = {
                ...this.price,
                amount: (this.price.amount || 0) * 100
            };
            if (!priceObj.id) {
                priceObj.active = 1;
                priceObj.currency = priceObj.currency || 'usd';
                priceObj.interval = priceObj.interval || 'month';
                priceObj.type = 'recurring';
            }
            yield this.confirm(priceObj);
        } catch (error) {
            this.notifications.showAPIError(error, {key: 'price.save.failed'});
        } finally {
            this.send('closeModal');
        }
    }

    actions = {
        confirm() {
            this.confirmAction(...arguments);
        },
        updatePeriod(oldPeriod, newPeriod) {
            this.price.interval = newPeriod;
        },
        setAmount(amount) {
            this.price.amount = !isNaN(amount) ? parseInt(amount) : 0;
        },

        // needed because ModalBase uses .send() for keyboard events
        closeModal() {
            this.close();
        }
    }
}
