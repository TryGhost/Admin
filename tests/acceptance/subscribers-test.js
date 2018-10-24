import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';
import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {beforeEach, describe, it} from 'mocha';
import {click, currentRouteName, currentURL, fillIn, find, findAll} from '@ember/test-helpers';
import {expect} from 'chai';
import {setupApplicationTest} from 'ember-mocha';
import {visit} from '../helpers/visit';

function withText(text, elements) {
    return elements.find(element => RegExp(text).test(element.textContent));
}

describe('Acceptance: Subscribers', function () {
    let hooks = setupApplicationTest();
    setupMirage(hooks);

    it('redirects to signin when not authenticated', async function () {
        await invalidateSession();
        await visit('/subscribers');

        expect(currentURL()).to.equal('/signin');
    });

    it('redirects editors to posts', async function () {
        let role = this.server.create('role', {name: 'Editor'});
        this.server.create('user', {roles: [role]});

        await authenticateSession();
        await visit('/subscribers');

        expect(currentURL()).to.equal('/');
        expect(findAll('[data-test-nav="subscribers"]').length, 'sidebar link is visible')
            .to.equal(0);
    });

    it('redirects authors to posts', async function () {
        let role = this.server.create('role', {name: 'Author'});
        this.server.create('user', {roles: [role]});

        await authenticateSession();
        await visit('/subscribers');

        expect(currentURL()).to.equal('/');
        expect(findAll('[data-test-nav="subscribers"]').length, 'sidebar link is visible')
            .to.equal(0);
    });

    it('redirects contributors to posts', async function () {
        let role = this.server.create('role', {name: 'Contributor'});
        this.server.create('user', {roles: [role]});

        await authenticateSession();
        await visit('/subscribers');

        expect(currentURL()).to.equal('/');
        expect(findAll('[data-test-nav="subscribers"]').length, 'sidebar link is visible')
            .to.equal(0);
    });

    describe('an admin', function () {
        beforeEach(async function () {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            return await authenticateSession();
        });

        it('can manage subscribers', async function () {
            this.server.createList('subscriber', 40);

            await visit('/');
            await click('[data-test-nav="subscribers"]');

            // it navigates to the correct page
            expect(currentRouteName()).to.equal('subscribers.index');

            // it has correct page title
            expect(document.title, 'page title')
                .to.equal('Subscribers - Test Blog');

            // it loads the first page
            // TODO: latest ember-in-viewport causes infinite scroll issues with
            // FF here where it loads two pages straight away so we need to check
            // if rows are greater than or equal to a single page
            expect(findAll('.subscribers-table .lt-body .lt-row').length, 'number of subscriber rows')
                .to.be.at.least(30);

            // it shows the total number of subscribers
            expect(find('[data-test-total-subscribers]').textContent.trim(), 'displayed subscribers total')
                .to.equal('(40)');

            // it defaults to sorting by created_at desc
            let [lastRequest] = this.server.pretender.handledRequests.slice(-1);
            expect(lastRequest.queryParams.order).to.equal('created_at desc');

            let createdAtHeader = withText('Subscription Date', find('.subscribers-table th'));
            expect(createdAtHeader, 'createdAt column is sorted')
                .to.have.class('is-sorted');
            expect(createdAtHeader.find('.gh-icon-descending').length, 'createdAt column has descending icon')
                .to.equal(1);

            // click the column to re-order
            await click(withText(find('th', 'Subscription Date')));

            // it flips the directions and re-fetches
            [lastRequest] = this.server.pretender.handledRequests.slice(-1);
            expect(lastRequest.queryParams.order).to.equal('created_at asc');

            createdAtHeader = withText('Subscription Date', find('.subscribers-table th'));
            expect(createdAtHeader.find('.gh-icon-ascending').length, 'createdAt column has ascending icon')
                .to.equal(1);

            // TODO: scroll test disabled as ember-light-table doesn't calculate
            // the scroll trigger element's positioning against the scroll
            // container - https://github.com/offirgolan/ember-light-table/issues/201
            //
            // // scroll to the bottom of the table to simulate infinite scroll
            // await find('.subscribers-table').scrollTop(find('.subscribers-table .ember-light-table').height() - 50);
            //
            // // trigger infinite scroll
            // await triggerEvent('.subscribers-table tbody', 'scroll');
            //
            // // it loads the next page
            // expect(find('.subscribers-table .lt-body .lt-row').length, 'number of subscriber rows after infinite-scroll')
            //     .to.equal(40);

            // click the add subscriber button
            await click('[data-test-link="add-subscriber"]');

            // it displays the add subscriber modal
            expect(findAll('[data-test-modal="new-subscriber"]').length, 'add subscriber modal displayed')
                .to.equal(1);

            // cancel the modal
            await click('[data-test-button="cancel-new-subscriber"]');

            // it closes the add subscriber modal
            expect(findAll('[data-test-modal]').length, 'add subscriber modal displayed after cancel')
                .to.equal(0);

            // save a new subscriber
            await click('[data-test-button="add-subscriber"]');
            await fillIn('[data-test-input="new-subscriber-email"]', 'test@example.com');
            await click('[data-test-button="create-subscriber"]');

            // the add subscriber modal is closed
            expect(findAll('[data-test-modal]').length, 'add subscriber modal displayed after save')
                .to.equal(0);

            // the subscriber is added to the table
            expect(find('.subscribers-table .lt-body .lt-row:first-of-type .lt-cell:first-of-type').textContent.trim(), 'first email in list after addition')
                .to.equal('test@example.com');

            // the table is scrolled to the top
            // TODO: implement scroll to new record after addition
            // expect(find('.subscribers-table').scrollTop(), 'scroll position after addition')
            //     .to.equal(0);

            // the subscriber total is updated
            expect(find('[data-test-total-subscribers]').textContent.trim(), 'subscribers total after addition')
                .to.equal('(41)');

            // saving a duplicate subscriber
            await click('[data-test-button="add-subscriber"]');
            await fillIn('[data-test-input="new-subscriber-email"]', 'test@example.com');
            await click('[data-test-button="create-subscriber"]');

            // the validation error is displayed
            expect(find('[data-test-error="new-subscriber-email"]').textContent.trim(), 'duplicate email validation')
                .to.equal('Email already exists.');

            // the subscriber is not added to the table
            expect(withText('test@example.com', findAll('.lt-cell')).length, 'number of "test@example.com rows"')
                .to.equal(1);

            // the subscriber total is unchanged
            expect(find('[data-test-total-subscribers]').textContent.trim(), 'subscribers total after failed add')
                .to.equal('(41)');

            // deleting a subscriber
            await click('[data-test-button="cancel-new-subscriber"]');
            await click('.subscribers-table tbody tr:first-of-type button:last-of-type');

            // it displays the delete subscriber modal
            expect(findAll('[data-test-modal="delete-subscriber"]').length, 'delete subscriber modal displayed')
                .to.equal(1);

            // cancel the modal
            await click('[data-test-button="cancel-delete-subscriber"]');

            // it closes the add subscriber modal
            expect(findAll('[data-test-modal]').length, 'delete subscriber modal displayed after cancel')
                .to.equal(0);

            await click('.subscribers-table tbody tr:first-of-type button:last-of-type');
            await click('[data-test-button="confirm-delete-subscriber"]');

            // the add subscriber modal is closed
            expect(findAll('[data-test-modal]').length, 'delete subscriber modal displayed after confirm')
                .to.equal(0);

            // the subscriber is removed from the table
            expect(find('.subscribers-table .lt-body .lt-row:first-of-type .lt-cell:first-of-type').textContent.trim(), 'first email in list after addition')
                .to.not.equal('test@example.com');

            // the subscriber total is updated
            expect(find('[data-test-total-subscribers]').textContent.trim(), 'subscribers total after addition')
                .to.equal('(40)');

            // click the import subscribers button
            await click('[data-test-link="import-csv"]');

            // it displays the import subscribers modal
            expect(findAll('[data-test-modal="import-subscribers"]').length, 'import subscribers modal displayed')
                .to.equal(1);
            expect(findAll('.fullscreen-modal input[type="file"]').length, 'import modal contains file input')
                .to.equal(1);

            // cancel the modal
            await click('[data-test-button="close-import-subscribers"]');

            // it closes the import subscribers modal
            expect(findAll('[data-test-modal]').length, 'import subscribers modal displayed after cancel')
                .to.equal(0);

            await click('[data-test-link="import-csv"]');
            await fileUpload('.fullscreen-modal input[type="file"]', ['test'], {name: 'test.csv'});

            // modal title changes
            expect(find('[data-test-modal="import-subscribers"] h1').textContent.trim(), 'import modal title after import')
                .to.equal('Import Successful');

            // modal button changes
            expect(find('[data-test-button="close-import-subscribers"]').textContent.trim(), 'import modal button text after import')
                .to.equal('Close');

            // subscriber total is updated
            expect(find('[data-test-total-subscribers]').textContent.trim(), 'subscribers total after import')
                .to.equal('(90)');

            // TODO: re-enable once bug in ember-light-table that triggers second page load is fixed
            // table is reset
            // [lastRequest] = this.server.pretender.handledRequests.slice(-1);
            // expect(lastRequest.url, 'endpoint requested after import')
            //     .to.match(/\/subscribers\/\?/);
            // expect(lastRequest.queryParams.page, 'page requested after import')
            //     .to.equal('1');

            // expect(find('.subscribers-table .lt-body .lt-row').length, 'number of rows in table after import')
            //     .to.equal(30);

            // close modal
        });
    });
});
