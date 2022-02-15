import moment from 'moment';
import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {blur,click,currentURL,fillIn,find,findAll,settled} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {timeout} from 'ember-concurrency';
import {visit} from '../helpers/visit';

module('Acceptance: Offers', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    test('redirects to signin when not authenticated', async function (assert) {
        await invalidateSession();
        await visit('/offers');

        assert.strictEqual(currentURL(), '/signin');
    });

    test('redirects non-admins to site', async function (assert) {
        let role = this.server.create('role', {name: 'Editor'});
        this.server.create('user', {roles: [role]});

        await authenticateSession();
        await visit('/offers');

        assert.strictEqual(currentURL(), '/site');
        assert.dom('[data-test-nav="offers"]').doesNotExist('sidebar link');
    });

    module('as owner', function (hooks) {
        hooks.beforeEach(async function () {
            this.server.loadFixtures('products');

            let role = this.server.create('role', {name: 'Owner'});
            this.server.create('user', {roles: [role]});

            return await authenticateSession();
        });

        test('it renders, can be navigated, can edit offer', async function (assert) {
            let offer1 = this.server.create('offer', {createdAt: moment.utc().subtract(1, 'day').valueOf()});
            this.server.create('offer', {createdAt: moment.utc().subtract(2, 'day').valueOf()});

            await visit('/offers');

            await settled();

            // lands on correct page
            assert.strictEqual(currentURL(), '/offers', 'currentURL');

            // it has correct page title
            assert.strictEqual(document.title, 'Offers - Test Blog', 'page title');

            // it lists all offers
            assert.strictEqual(findAll('[data-test-list="offers-list-item"]').length, 2, 'offers list count');

            let offer = find('[data-test-list="offers-list-item"]');
            assert.strictEqual(offer.querySelector('[data-test-list="offer-name"] h3').textContent, offer1.name, 'offer list item name');

            await visit(`/offers/${offer1.id}`);

            // second wait is needed for the offer details to settle
            await settled();

            // it shows selected offer form
            assert.strictEqual(find('[data-test-input="offer-name"]').value, offer1.name, 'loads correct offer into form');

            // trigger save
            await fillIn('[data-test-input="offer-name"]', 'New Name');
            await blur('[data-test-input="offer-name"]');

            await click('[data-test-button="save"]');

            // extra timeout needed for Travis - sometimes it doesn't update
            // quick enough and an extra wait() call doesn't help
            await timeout(100);

            await click('[data-test-link="offers-back"]');

            // lands on correct page
            assert.strictEqual(currentURL(), '/offers', 'currentURL');
        });
    });
});
