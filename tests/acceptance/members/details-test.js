import {authenticateSession} from 'ember-simple-auth/test-support';
import {currentURL, findAll} from '@ember/test-helpers';
import {enableLabsFlag} from '../../helpers/labs-flag';
import {expect} from 'chai';
import {setupApplicationTest} from 'ember-mocha';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../../helpers/visit';

describe('Acceptance: Members details', function () {
    let hooks = setupApplicationTest();
    setupMirage(hooks);

    let clock;

    beforeEach(async function () {
        this.server.loadFixtures('configs');
        this.server.loadFixtures('settings');
        enableLabsFlag(this.server, 'membersLastSeenFilter');
        enableLabsFlag(this.server, 'membersTimeFilters');
        enableLabsFlag(this.server, 'multipleProducts');

        // test with stripe connected and email turned on
        // TODO: add these settings to default fixtures
        this.server.db.settings.find({key: 'stripe_connect_account_id'})
            ? this.server.db.settings.update({key: 'stripe_connect_account_id'}, {value: 'stripe_connected'})
            : this.server.create('setting', {key: 'stripe_connect_account_id', value: 'stripe_connected', group: 'members'});

        this.server.db.settings.find({key: 'editor_default_email_recipients'})
            ? this.server.db.settings.update({key: 'editor_default_email_recipients'}, {value: 'visibility'})
            : this.server.create('setting', {key: 'editor_default_email_recipients', value: 'visibility', group: 'editor'});

        let role = this.server.create('role', {name: 'Owner'});
        this.server.create('user', {roles: [role]});

        return await authenticateSession();
    });

    afterEach(function () {
        clock?.restore();
    });

    it('has a known base-state', async function () {
        const product = this.server.create('product', {
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
        const member = this.server.create('member', {
            id: 1,
            subscriptions: [
                {
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
                            product_id: '6213b3f6cb39ebdb03ebd810'
                        }
                    },
                    offer: null
                },
                {
                    id: 'sub_1KZGi6EGb07FFvyNDjZq98g8',
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
                            product_id: '6213b3f6cb39ebdb03ebd810'
                        }
                    },
                    tier: {
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
                    },
                    offer: null
                }
            ],
            products: [
                product
            ]
        });

        await visit(`/members/${member.id}`);

        expect(currentURL()).to.equal(`/members/${member.id}`);

        expect(findAll('[data-test-block="member-subscription"]').length, 'displays all member subscriptions')
            .to.equal(2);
    });

    it('displays correctly one canceled subscription', async function () {
        const member = this.server.create('member', {
            id: 1,
            subscriptions: [
                {
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
                            product_id: '6213b3f6cb39ebdb03ebd810'
                        }
                    },
                    tier: {
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
                    },
                    offer: null
                }
            ],
            products: []
        });

        await visit(`/members/${member.id}`);

        expect(currentURL()).to.equal(`/members/${member.id}`);

        expect(findAll('[data-test-block="member-subscription"]').length, 'displays all member subscriptions')
            .to.equal(1);
    });
});
