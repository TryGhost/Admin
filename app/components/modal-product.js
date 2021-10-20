import EmberObject, {action} from '@ember/object';
import ModalBase from 'ghost-admin/components/modal-base';
import ProductBenefitItem from '../models/product-benefit-item';
import classic from 'ember-classic-decorator';
import {currencies, getCurrencyOptions, getNonDecimal, getSymbol, isNonCurrencies} from 'ghost-admin/utils/currency';
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
    @tracked benefits = emberA([]);
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
            this.currency = monthlyPrice.currency;
            this.stripeMonthlyAmount = getNonDecimal(monthlyPrice.amount, this.currency);
        }
        if (yearlyPrice) {
            this.stripeYearlyAmount = getNonDecimal(yearlyPrice.amount, this.currency);
        }
        this.benefits = this.product.get('benefits') || emberA([]);
        this.newBenefit = ProductBenefitItem.create({
            isNew: true,
            name: ''
        });
    }

    get title() {
        if (this.isExistingProduct) {
            return `Edit tier`;
        }
        return 'New tier';
    }

    get isExistingProduct() {
        return !this.model.product.isNew;
    }

    @action
    close(event) {
        this.reset();
        event?.preventDefault?.();
        this.closeModal();
    }
    @action
    setCurrency(event) {
        const newCurrency = event.value;
        this.currency = newCurrency;
    }

    reset() {
        this.newBenefit = ProductBenefitItem.create({isNew: true, name: ''});
        const savedBenefits = this.product.benefits?.filter(benefit => !!benefit.id) || emberA([]);
        this.product.set('benefits', savedBenefits);
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

        if (!this.newBenefit.get('isBlank')) {
            yield this.send('addBenefit', this.newBenefit);
        }

        const monthlyAmount = isNonCurrencies(this.currency) ? this.stripeMonthlyAmount : this.stripeMonthlyAmount * 100;
        const yearlyAmount = isNonCurrencies(this.currency) ? this.stripeYearlyAmount : this.stripeYearlyAmount * 100;
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
        this.product.set('benefits', this.benefits);
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
        focusItem() {
            // Focus on next benefit on enter
        },
        deleteBenefit(item) {
            if (!item) {
                return;
            }
            this.benefits.removeObject(item);
        },
        reorderItems() {
            this.product.set('benefits', this.benefits);
        },
        updateLabel(label, benefitItem) {
            if (!benefitItem) {
                return;
            }

            if (benefitItem.get('name') !== label) {
                benefitItem.set('name', label);
            }
        },
        // noop - we don't want the enter key doing anything
        confirm() {},
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
