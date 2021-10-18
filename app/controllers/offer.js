import Controller, {inject as controller} from '@ember/controller';
import config from 'ghost-admin/config/environment';
import copyTextToClipboard from 'ghost-admin/utils/copy-text-to-clipboard';
import {action} from '@ember/object';
import {getSymbol} from 'ghost-admin/utils/currency';
import {ghPriceAmount} from '../helpers/gh-price-amount';
import {inject as service} from '@ember/service';
import {slugify} from '@tryghost/string';
import {task} from 'ember-concurrency-decorators';
import {timeout} from 'ember-concurrency';
import {tracked} from '@glimmer/tracking';

export default class OffersController extends Controller {
    @controller offers;
    @service config;
    @service settings;
    @service store;
    @service modals;
    @service membersUtils;
    @service notifications;

    @tracked cadences = [];
    @tracked products = [];
    @tracked portalPreviewUrl = '';
    @tracked showUnsavedChangesModal = false;

    @tracked durations = [
        {
            label: 'Forever',
            duration: 'forever'
        },
        {
            label: 'Once',
            duration: 'once'
        },
        {
            label: 'Multiple months',
            duration: 'repeating'
        }
    ];

    @tracked offertypes = [
        {
            label: '%',
            offertype: 'percent'
        },
        {
            label: 'USD',
            offertype: 'fixed'
        }
    ];

    @tracked defaultProps = null;

    leaveScreenTransition = null;
    portalPreviewGuid = Date.now().valueOf();

    constructor() {
        super(...arguments);
        if (this.isTesting === undefined) {
            this.isTesting = config.environment === 'test';
        }
    }

    get offer() {
        return this.model;
    }

    set offer(offer) {
        this.model = offer;
    }

    get scratchOffer() {
        return {
            ...this.offer
        };
    }

    get cadence() {
        if (this.offer.tier && this.offer.cadence) {
            const product = this.products.findBy('id', this.offer.tier.id);
            return `${this.offer.tier.id}-${this.offer.cadence}-${product?.monthlyPrice?.currency}`;
        } else if (this.defaultProps) {
            const product = this.products.findBy('id', this.defaultProps.tier.id);
            return `${this.defaultProps.tier.id}-${this.defaultProps.cadence}-${product?.monthlyPrice?.currency}`;
        }
        return '';
    }

    get isDiscountSectionDisabled() {
        return !this.offer.isNew;
    }

    // Tasks -------------------------------------------------------------------

    @task({drop: true})
    *fetchProducts() {
        this.products = yield this.store.query('product', {include: 'monthly_price,yearly_price'});
        const cadences = [];
        this.products.forEach((product) => {
            let monthlyLabel;
            let yearlyLabel;
            const productCurrency = product.monthlyPrice.currency;
            const productCurrencySymbol = productCurrency.toUpperCase();

            monthlyLabel = `${product.name} - Monthly (${ghPriceAmount(product.monthlyPrice.amount)} ${productCurrencySymbol})`;
            yearlyLabel = `${product.name} - Yearly (${ghPriceAmount(product.yearlyPrice.amount)} ${productCurrencySymbol})`;

            cadences.push({
                label: monthlyLabel,
                name: `${product.id}-month-${productCurrency}`
            });

            cadences.push({
                label: yearlyLabel,
                name: `${product.id}-year-${productCurrency}`
            });
        });
        this.cadences = cadences;
        const defaultCadence = this.cadences[0]?.name;
        if (this.offer && !this.offer.tier) {
            this.defaultProps = {};
            this.updateCadence(this.cadences[0]?.name, this.defaultProps);
            this.updatePortalPreview({forceRefresh: false});
        } else if (defaultCadence) {
            const [,, currency] = (defaultCadence || '').split('-');
            this.offertypes = [
                {
                    label: '%',
                    offertype: 'percent'
                },
                {
                    label: currency.toUpperCase(),
                    offertype: 'fixed'
                }
            ];
            this.updatePortalPreview({forceRefresh: false});
        }
    }

    @task({drop: true})
    *copyOfferUrl() {
        copyTextToClipboard(this.offerUrl);
        yield timeout(this.isTesting ? 50 : 500);
        return true;
    }

    @task({drop: true})
    *saveTask() {
        let {offer} = this;

        if (!offer.tier && this.defaultProps) {
            this.offer.tier = {
                id: this.defaultProps?.tier.id
            };
            this.offer.cadence = this.defaultProps.cadence;
            this.offer.currency = this.defaultProps.currency;
        }

        try {
            yield offer.save();

            // replace 'offer.new' route with 'offer' route
            this.replaceRoute('offer', offer);

            return offer;
        } catch (error) {
            if (error) {
                this.notifications.showAPIError(error, {key: 'offer.save'});
            }
        }
    }

    @task
    *fetchOfferTask(offerId) {
        this.isLoading = true;

        this.offer = yield this.store.queryRecord('offer', {
            id: offerId
        });

        this.isLoading = false;
    }

    @action
    portalPreviewInserted() {}

    @action
    portalPreviewDestroyed() {}

    @action
    updatePortalPreview({forceRefresh} = {forceRefresh: false}) {
        const newUrl = new URL(this.membersUtils.getOfferPortalPreviewUrl({
            name: this.offer.name || 'No Name',
            code: this.offer.code || 'no-code',
            displayTitle: this.offer.displayTitle,
            displayDescription: this.offer.displayDescription,
            type: this.offer.type,
            cadence: this.offer.cadence || this.defaultProps?.cadence,
            amount: this.offer.amount,
            duration: this.offer.duration,
            durationInMonths: '',
            currency: this.offer.currency || this.defaultProps?.currency,
            status: this.offer.currency,
            tierId: this.offer?.tier?.id || this.defaultProps?.tier?.id
        }));

        if (forceRefresh) {
            this.portalPreviewGuid = Date.now().valueOf();
        }
        newUrl.searchParams.set('v', `${this.portalPreviewGuid}`);

        this.portalPreviewUrl = newUrl;
    }

    @action
    save() {
        return this.saveTask.perform();
    }

    @action
    leaveScreen() {
        this.offer.rollbackAttributes();
        return this.leaveScreenTransition.retry();
    }

    @action
    toggleUnsavedChangesModal(transition) {
        let leaveTransition = this.leaveScreenTransition;

        if (!transition && this.showUnsavedChangesModal) {
            this.leaveScreenTransition = null;
            this.showUnsavedChangesModal = false;
            return;
        }

        if (!leaveTransition || transition.targetName === leaveTransition.targetName) {
            this.leaveScreenTransition = transition;

            // if a save is running, wait for it to finish then transition
            if (this.save.isRunning) {
                return this.save.last.then(() => {
                    transition.retry();
                });
            }

            // we genuinely have unsaved data, show the modal
            this.showUnsavedChangesModal = true;
        }
    }

    @action
    setup() {
        this.fetchProducts.perform();
    }

    @action
    setProperty(propKey, value) {
        this._saveOfferProperty(propKey, value);
    }

    @action
    setDiscountType(discountType) {
        if (!this.isDiscountSectionDisabled) {
            this._saveOfferProperty('type', discountType);
            if (this.offer.type === 'fixed' && this.offer.amount !== '') {
                this.offer.amount = this.offer.amount * 100;
            } else if (this.offer.amount !== '') {
                this.offer.amount = this.offer.amount / 100;
            }
            this.updatePortalPreview({forceRefresh: false});
        }
    }

    @action
    setDiscountAmount(e) {
        let amount = e.target.value;
        if (this.offer.type === 'fixed' && amount !== '') {
            amount = parseInt(amount) * 100;
        }
        this._saveOfferProperty('amount', amount);
    }

    @action
    setOfferName(e) {
        this._saveOfferProperty('name', e.target.value);
    }

    @action
    setPortalTitle(e) {
        this._saveOfferProperty('displayTitle', e.target.value);
    }

    @action
    setPortalDescription(e) {
        this._saveOfferProperty('displayDescription', e.target.value);
    }

    @action
    setOfferCode(e) {
        this._saveOfferProperty('code', e.target.value);
    }

    @action
    setDurationInMonths(e) {
        this._saveOfferProperty('durationInMonths', e.target.value);
    }

    @action
    openConfirmArchiveModal() {
        if (!this.offer.isNew) {
            this.modals.open('modals/archive-offer', {
                offer: this.offer
            }, {
                className: 'fullscreen-modal fullscreen-modal-action fullscreen-modal-wide'
            });
        }
    }

    @action
    openConfirmUnarchiveModal() {
        if (!this.offer.isNew) {
            this.modals.open('modals/unarchive-offer', {
                offer: this.offer
            }, {
                className: 'fullscreen-modal fullscreen-modal-action fullscreen-modal-wide'
            });
        }
    }

    get offerUrl() {
        const code = this.offer?.code || '';
        if (code) {
            const siteUrl = this.config.get('blogUrl');
            return `${siteUrl}/${slugify(code)}`;
        }
        return '';
    }

    get displayCurrency() {
        const tierId = this.offer?.tier?.id;
        if (!tierId) {
            return '$';
        }
        const product = this.products.findBy('id', tierId);
        const productCurrency = product?.monthlyPrice?.currency || 'usd';
        return getSymbol(productCurrency);
    }

    get currencyLength() {
        return this.displayCurrency.length;
    }

    @action
    updateCadence(cadence, offerObj) {
        offerObj = offerObj || this.offer;
        if (cadence) {
            const [tierId, tierCadence, currency] = cadence.split('-');
            offerObj.tier = {
                id: tierId
            };
            offerObj.cadence = tierCadence;
            offerObj.currency = currency;
            this.offertypes = [
                {
                    label: '%',
                    offertype: 'percent'
                },
                {
                    label: currency.toUpperCase(),
                    offertype: 'fixed'
                }
            ];
            this.updatePortalPreview({forceRefresh: false});
        }
    }

    @action
    updateDuration(duration) {
        this._saveOfferProperty('duration', duration);
    }

    // Private -----------------------------------------------------------------

    _saveOfferProperty(propKey, newValue) {
        let currentValue = this.offer[propKey];

        // avoid modifying empty values and triggering inadvertant unsaved changes modals
        if (newValue !== false && !newValue && !currentValue) {
            return;
        }

        this.offer[propKey] = newValue;
        this.updatePortalPreview({forceRefresh: false});
    }
}
