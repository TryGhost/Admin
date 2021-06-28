import EmberObject, {action} from '@ember/object';
import ModalBase from 'ghost-admin/components/modal-base';
import ProductBenefitItem from '../models/product-benefit-item';
import classic from 'ember-classic-decorator';
import {currencies, getCurrencyOptions, getSymbol} from 'ghost-admin/utils/currency';
import {A as emberA} from '@ember/array';
import {isEmpty} from '@ember/utils';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency-decorators';
import {tracked} from '@glimmer/tracking';

const CURRENCIES = currencies.map((currency) => {
    return {
        value: currency.isoCode.toLowerCase(),
        label: `${currency.isoCode} - ${currency.name}`,
        isoCode: currency.isoCode
    };
});

let BENEFITSDATA = emberA([
    ProductBenefitItem.create({
        name: 'Benefit 1'
    }),
    ProductBenefitItem.create({
        name: 'Benefit 2'
    }),
    ProductBenefitItem.create({
        name: 'Benefit 3'
    }),
    ProductBenefitItem.create({
        name: 'Benefit 4'
    }),
    ProductBenefitItem.create({
        name: 'Benefit 5'
    }),
    ProductBenefitItem.create({
        name: 'Benefit 6'
    }),
    ProductBenefitItem.create({
        name: 'Benefit 7'
    })
]);

// TODO: update modals to work fully with Glimmer components
@classic
export default class ModalProductPrice extends ModalBase {
    @service settings;
    @tracked model;
    @tracked product;
    @tracked periodVal;
    @tracked stripeMonthlyAmount = 5;
    @tracked stripeYearlyAmount = 50;
    @tracked currency = 'usd';
    @tracked errors = EmberObject.create();
    @tracked stripePlanError = '';
    @tracked benefits = [];
    @tracked newBenefit = null;

    confirm() {}

    get allCurrencies() {
        return getCurrencyOptions();
    }

    get selectedCurrency() {
        return CURRENCIES.findBy('value', this.currency);
    }

    init() {
        super.init(...arguments);
        this.product = this.model.product;
        const monthlyPrice = this.product.get('monthlyPrice');
        const yearlyPrice = this.product.get('yearlyPrice');
        if (monthlyPrice) {
            this.stripeMonthlyAmount = (monthlyPrice.amount / 100);
            this.currency = monthlyPrice.currency;
        }
        if (yearlyPrice) {
            this.stripeYearlyAmount = (yearlyPrice.amount / 100);
        }
        this.benefits = this.product.get('benefits') || BENEFITSDATA;
        this.newBenefit = ProductBenefitItem.create({
            isNew: true,
            name: ''
        });
    }

    get title() {
        if (this.isExistingProduct) {
            return `Edit product`;
        }
        return 'New Product';
    }

    get isExistingProduct() {
        return !this.model.product.isNew;
    }

    // TODO: rename to confirm() when modals have full Glimmer support
    @action
    confirmAction() {
        this.saveProduct.perform();
    }

    @action
    close(event) {
        event?.preventDefault?.();
        this.closeModal();
    }
    @action
    setCurrency(event) {
        const newCurrency = event.value;
        this.currency = newCurrency;
    }

    @task({drop: true})
    *saveProduct() {
        this.validatePrices();
        if (!isEmpty(this.errors) && Object.keys(this.errors).length > 0) {
            return;
        }
        if (this.stripePlanError) {
            return;
        }
        const monthlyAmount = this.stripeMonthlyAmount * 100;
        const yearlyAmount = this.stripeYearlyAmount * 100;
        this.product.set('monthlyPrice', {
            nickname: 'Monthly',
            amount: monthlyAmount,
            active: true,
            currency: this.currency,
            interval: 'month',
            type: 'recurring'
        });
        this.product.set('yearlyPrice', {
            nickname: 'Yearly',
            amount: yearlyAmount,
            active: true,
            currency: this.currency,
            interval: 'year',
            type: 'recurring'
        });

        yield this.product.save();

        yield this.confirm();
        this.send('closeModal');
    }

    validatePrices() {
        this.stripePlanError = undefined;

        try {
            const yearlyAmount = this.stripeYearlyAmount;
            const monthlyAmount = this.stripeMonthlyAmount;
            const symbol = getSymbol(this.currency);
            if (!yearlyAmount || yearlyAmount < 1 || !monthlyAmount || monthlyAmount < 1) {
                throw new TypeError(`Subscription amount must be at least ${symbol}1.00`);
            }
        } catch (err) {
            this.stripePlanError = err.message;
        }
    }

    addNewBenefitItem(item) {
        item.set('isNew', false);
        this.benefits.pushObject(item);

        this.newBenefit = ProductBenefitItem.create({isNew: true, name: ''});
    }

    actions = {
        addBenefit(item) {
            return item.validate().then(() => {
                this.addNewBenefitItem(item);
            });
        },
        deleteBenefit(item) {
            if (!item) {
                return;
            }
            this.benefits.removeObject(item);
        },
        updateLabel(label, benefitItem) {
            if (!benefitItem) {
                return;
            }

            if (benefitItem.get('name') !== label) {
                benefitItem.set('name', label);
            }
        },
        confirm() {
            this.confirmAction(...arguments);
        },
        setAmount(amount) {
            this.price.amount = !isNaN(amount) ? parseInt(amount) : 0;
        },

        setCurrency(event) {
            const newCurrency = event.value;
            this.currency = newCurrency;
        },
        validateStripePlans() {
            this.stripePlanError = undefined;

            try {
                const yearlyAmount = this.stripeYearlyAmount;
                const monthlyAmount = this.stripeMonthlyAmount;
                const symbol = getSymbol(this.currency);
                if (!yearlyAmount || yearlyAmount < 1 || !monthlyAmount || monthlyAmount < 1) {
                    throw new TypeError(`Subscription amount must be at least ${symbol}1.00`);
                }
            } catch (err) {
                this.stripePlanError = err.message;
            }
        },
        // needed because ModalBase uses .send() for keyboard events
        closeModal() {
            this.close();
        }
    }
}
