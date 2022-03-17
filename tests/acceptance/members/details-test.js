import {authenticateSession} from 'ember-simple-auth/test-support';
import {click, currentURL, find, findAll} from '@ember/test-helpers';
import {enableLabsFlag} from '../../helpers/labs-flag';
import {expect} from 'chai';
import {setupApplicationTest} from 'ember-mocha';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../../helpers/visit';

describe('Acceptance: Member details', function () {
    let hooks = setupApplicationTest();
    setupMirage(hooks);

    let clock;
    let product;

    beforeEach(async function () {
        this.server.loadFixtures('configs');
        this.server.loadFixtures('settings');
        enableLabsFlag(this.server, 'membersLastSeenFilter');
        enableLabsFlag(this.server, 'membersTimeFilters');
        enableLabsFlag(this.server, 'multipleProducts');

        // test with stripe connected and email turned on
        // TODO: add these settings to default fixtures
        this.server.db.settings.find({key: 'stripe_connect_account_id'})
            ? this.server.db.settings.update({key: 'stripe_connect_account_id'}, {value: 'stripe_account_id'})
            : this.server.create('setting', {key: 'stripe_connect_account_id', value: 'stripe_account_id', group: 'members'});
        // needed for membersUtils.isStripeEnabled
        this.server.db.settings.find({key: 'stripe_connect_secret_key'})
            ? this.server.db.settings.update({key: 'stripe_connect_secret_key'}, {value: 'stripe_secret_key'})
            : this.server.create('setting', {key: 'stripe_connect_secret_key', value: 'stripe_secret_key', group: 'members'});
        this.server.db.settings.find({key: 'stripe_connect_publishable_key'})
            ? this.server.db.settings.update({key: 'stripe_connect_publishable_key'}, {value: 'stripe_secret_key'})
            : this.server.create('setting', {key: 'stripe_connect_publishable_key', value: 'stripe_secret_key', group: 'members'});

        this.server.db.settings.find({key: 'editor_default_email_recipients'})
            ? this.server.db.settings.update({key: 'editor_default_email_recipients'}, {value: 'visibility'})
            : this.server.create('setting', {key: 'editor_default_email_recipients', value: 'visibility', group: 'editor'});

        // add a default product that complimentary plans can be assigned to
        product = this.server.create('product', {
            id: '6213b3f6cb39ebdb03ebd810',
            name: 'Ghost Subscription',
            slug: 'ghost-subscription',
            created_at: '2022-02-21T16:47:02.000Z',
            updated_at: '2022-03-03T15:37:02.000Z',
            description: null,
            monthly_price_id: '6220df272fee0571b5dd0a0a',
            yearly_price_id: '6220df272fee0571b5dd0a0b',
            type: 'paid',
            active: true,
            welcome_page_url: '/'
        });

        let role = this.server.create('role', {name: 'Owner'});
        this.server.create('user', {roles: [role]});

        return await authenticateSession();
    });

    afterEach(function () {
        clock?.restore();
    });

    it('has a known base-state', async function () {
        const member = this.server.create('member', {
            id: 1,
            subscriptions: [
                this.server.create('subscription', {
                    id: 'sub_1KZGcmEGb07FFvyN9jwrwbKu',
                    customer: {
                        id: 'cus_LFmBWoSkB84lnr',
                        name: 'test',
                        email: 'test@ghost.org'
                    },
                    plan: {
                        id: 'price_1KZGc6EGb07FFvyNkK3umKiX',
                        nickname: 'Monthly',
                        amount: 500,
                        interval: 'month',
                        currency: 'USD'
                    },
                    status: 'canceled',
                    start_date: '2022-03-03T15:31:27.000Z',
                    default_payment_card_last4: '4242',
                    cancel_at_period_end: false,
                    cancellation_reason: null,
                    current_period_end: '2022-04-03T15:31:27.000Z',
                    price: {
                        id: 'price_1KZGc6EGb07FFvyNkK3umKiX',
                        price_id: '6220df272fee0571b5dd0a0a',
                        nickname: 'Monthly',
                        amount: 500,
                        interval: 'month',
                        type: 'recurring',
                        currency: 'USD',
                        product: {
                            id: 'prod_LFmAAmCnnbzrvL',
                            name: 'Ghost Subscription',
                            product_id: product.id
                        }
                    },
                    offer: null
                }),
                this.server.create('subscription', {
                    id: 'sub_1KZGi6EGb07FFvyNDjZq98g8',
                    product,
                    customer: {
                        id: 'cus_LFmGicpX4BkQKH',
                        name: '123',
                        email: 'test@ghost.org'
                    },
                    plan: {
                        id: 'price_1KZGc6EGb07FFvyNkK3umKiX',
                        nickname: 'Monthly',
                        amount: 500,
                        interval: 'month',
                        currency: 'USD'
                    },
                    status: 'active',
                    start_date: '2022-03-03T15:36:58.000Z',
                    default_payment_card_last4: '4242',
                    cancel_at_period_end: false,
                    cancellation_reason: null,
                    current_period_end: '2022-04-03T15:36:58.000Z',
                    price: {
                        id: 'price_1KZGc6EGb07FFvyNkK3umKiX',
                        price_id: '6220df272fee0571b5dd0a0a',
                        nickname: 'Monthly',
                        amount: 500,
                        interval: 'month',
                        type: 'recurring',
                        currency: 'USD',
                        product: {
                            id: 'prod_LFmAAmCnnbzrvL',
                            name: 'Ghost Subscription',
                            product_id: product.id
                        }
                    },
                    offer: null
                })
            ],
            products: [
                product
            ]
        });

        await visit(`/members/${member.id}`);

        expect(currentURL()).to.equal(`/members/${member.id}`);

        expect(findAll('[data-test-subscription]').length, 'displays all member subscriptions')
            .to.equal(2);
    });

    it('displays correctly one canceled subscription', async function () {
        const member = this.server.create('member', {
            id: 1,
            subscriptions: [
                this.server.create('subscription', {
                    id: 'sub_1KZGcmEGb07FFvyN9jwrwbKu',
                    product,
                    customer: {
                        id: 'cus_LFmBWoSkB84lnr',
                        name: 'test',
                        email: 'test@ghost.org'
                    },
                    plan: {
                        id: 'price_1KZGc6EGb07FFvyNkK3umKiX',
                        nickname: 'Monthly',
                        amount: 500,
                        interval: 'month',
                        currency: 'USD'
                    },
                    status: 'canceled',
                    start_date: '2022-03-03T15:31:27.000Z',
                    default_payment_card_last4: '4242',
                    cancel_at_period_end: false,
                    cancellation_reason: null,
                    current_period_end: '2022-04-03T15:31:27.000Z',
                    price: {
                        id: 'price_1KZGc6EGb07FFvyNkK3umKiX',
                        price_id: '6220df272fee0571b5dd0a0a',
                        nickname: 'Monthly',
                        amount: 500,
                        interval: 'month',
                        type: 'recurring',
                        currency: 'USD',
                        product: {
                            id: 'prod_LFmAAmCnnbzrvL',
                            name: 'Ghost Subscription',
                            product_id: '6213b3f6cb39ebdb03ebd810'
                        }
                    },
                    offer: null
                })
            ],
            products: []
        });

        await visit(`/members/${member.id}`);

        expect(currentURL()).to.equal(`/members/${member.id}`);

        expect(findAll('[data-test-subscription]').length, 'displays all member subscriptions')
            .to.equal(1);
    });

    it('can add and remove complimentary subscription', async function () {
        const member = this.server.create('member', {name: 'Comp Member Test'});

        await visit(`/members/${member.id}`);

        expect(findAll('[data-test-button="add-complimentary"]').length, '# of add complimentary buttons')
            .to.equal(1);

        await click('[data-test-button="add-complimentary"]');
        expect(find('[data-test-modal="member-product"]'), 'select product modal').to.exist;
        expect(find('[data-test-text="select-tier-desc"]')).to.contain.text('Comp Member Test');
        expect(find('[data-test-tier-option="6213b3f6cb39ebdb03ebd810"]')).to.have.exist;
        expect(find('[data-test-tier-option="6213b3f6cb39ebdb03ebd810"]')).to.have.class('active');
        await click('[data-test-button="save-comp-product"]');

        expect(findAll('[data-test-subscription]').length, '# of subscription blocks - after add comped')
            .to.equal(1);

        await click('[data-test-product="complimentary"] [data-test-button="subscription-actions"]');
        await click('[data-test-product="complimentary"] [data-test-button="remove-complimentary"]');

        expect(findAll('[data-test-subscription]').length, '# of subscription blocks - after remove comped')
            .to.equal(0);
    });

    it('can add complimentary subscription when member has canceled subscriptions');
});
