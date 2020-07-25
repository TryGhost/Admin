import moment from 'moment';
import wait from 'ember-test-helpers/wait';
import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {beforeEach, describe, it} from 'mocha';
import {blur, click, currentRouteName, currentURL, fillIn, find, findAll} from '@ember/test-helpers';
import {expect} from 'chai';
import {setupApplicationTest} from 'ember-mocha';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {timeout} from 'ember-concurrency';
import {visit} from '../helpers/visit';

describe('Acceptance: Members', function () {
    let hooks = setupApplicationTest();
    setupMirage(hooks);

    it('redirects to signin when not authenticated', async function () {
        await invalidateSession();
        await visit('/members');

        expect(currentURL()).to.equal('/signin');
    });

    it('redirects non-admins to posts', async function () {
        let role = this.server.create('role', {name: 'Editor'});
        this.server.create('user', {roles: [role]});

        await authenticateSession();
        await visit('/members');

        expect(currentURL()).to.equal('/site');
        expect(find('[data-test-nav="members"]'), 'sidebar link')
            .to.not.exist;
    });

    describe('as owner', function () {
        beforeEach(async function () {
            this.server.loadFixtures('configs');

            let role = this.server.create('role', {name: 'Owner'});
            this.server.create('user', {roles: [role]});

            return await authenticateSession();
        });

        it('shows sidebar link which navigates to members list', async function () {
            await visit('/settings/labs');
            await click('#labs-members');
            await visit('/');

            expect(find('[data-test-nav="members"]'), 'sidebar link')
                .to.exist;

            await click('[data-test-nav="members"]');

            expect(currentURL()).to.equal('/members');
            expect(currentRouteName()).to.equal('members.index');
            expect(find('[data-test-screen-title]')).to.have.text('Members');
        });

        it('it renders, can be navigated, can edit member', async function () {
            let member1 = this.server.create('member', {createdAt: moment.utc().subtract(1, 'day').valueOf()});
            this.server.create('member', {createdAt: moment.utc().subtract(2, 'day').valueOf()});

            await visit('/members');

            // second wait is needed for the vertical-collection to settle
            await wait();

            // lands on correct page
            expect(currentURL(), 'currentURL').to.equal('/members');

            // it has correct page title
            expect(document.title, 'page title').to.equal('Members - Test Blog');

            // it lists all members
            expect(findAll('.members-list .gh-members-list-item').length, 'members list count')
                .to.equal(2);

            let member = find('.members-list .gh-members-list-item');
            expect(member.querySelector('.gh-members-list-name').textContent, 'member list item title')
                .to.equal(member1.name);

            await visit(`/members/${member1.id}`);

            // // second wait is needed for the member details to settle
            await wait();

            // it shows selected member form
            expect(find('.gh-member-settings-primary input[name="name"]').value, 'loads correct member into form')
                .to.equal(member1.name);

            expect(find('.gh-member-settings-primary input[name="email"]').value, 'loads correct email into form')
                .to.equal(member1.email);

            // trigger save
            await fillIn('.gh-member-settings-primary input[name="name"]', 'New Name');
            await blur('.gh-member-settings-primary input[name="name"]');

            await click('[data-test-button="save"]');

            // extra timeout needed for Travis - sometimes it doesn't update
            // quick enough and an extra wait() call doesn't help
            await timeout(100);

            await click('[data-test-link="members-back"]');

            await wait();

            // lands on correct page
            expect(currentURL(), 'currentURL').to.equal('/members');
        });

        it('can create a new member', async function () {
            this.server.create('member', {createdAt: moment.utc().subtract(1, 'day').valueOf()});

            await visit('/members');

            // second wait is needed for the vertical-collection to settle
            await wait();

            // lands on correct page
            expect(currentURL(), 'currentURL').to.equal('/members');

            // it has correct page title
            expect(document.title, 'page title').to.equal('Members - Test Blog');

            // it lists all members
            expect(findAll('.members-list .gh-members-list-item').length, 'members list count')
                .to.equal(1);

            //  start new member
            await click('[data-test-new-member-button="true"]');

            // it navigates to the new member route
            expect(currentURL(), 'new member URL').to.equal('/members/new');
            // it displays the new member form
            expect(find('.gh-canvas-header h2').textContent, 'settings pane title')
                .to.contain('New member');

            // all fields start blank
            findAll('.gh-member-settings-primary .gh-input').forEach(function (elem) {
                expect(elem.value, `input field for ${elem.getAttribute('name')}`)
                    .to.be.empty;
            });

            // save new member
            await fillIn('.gh-member-settings-primary input[name="name"]', 'New Name');
            await blur('.gh-member-settings-primary input[name="name"]');

            await fillIn('.gh-member-settings-primary input[name="email"]', 'example@domain.com');
            await blur('.gh-member-settings-primary input[name="email"]');

            await click('[data-test-button="save"]');

            await wait();

            expect(find('.gh-member-settings-primary input[name="name"]').value, 'name has been preserved')
                .to.equal('New Name');

            expect(find('.gh-member-settings-primary input[name="email"]').value, 'email has been preserved')
                .to.equal('example@domain.com');
        });
    });

    describe('bulk delete', function () {
        beforeEach(async function () {
            this.server.loadFixtures('configs');

            let config = this.server.schema.configs.first();
            config.update({
                enableDeveloperExperiments: true
            });

            let role = this.server.create('role', {name: 'Owner'});
            this.server.create('user', {roles: [role]});

            return await authenticateSession();
        });

        it('can delete filtered list of unsubscribed members', async function () {
            this.server.createList('member', 5);
            let label = this.server.create('label');
            this.server.createList('member', 100, {labels: [label]});

            await visit('/members');

            // sanity check on member count
            expect(find('[data-test-list-header]')).to.contain.text('105 members');

            // bulk delete button is not shown
            expect(find('[data-test-button="bulk-delete"]')).to.not.exist;

            await click('[data-test-dropdown="label-filter"]');
            await click(`[data-test-label-filter="${label.slug}"]`);

            // sanity check on member count
            expect(find('[data-test-list-header]')).to.contain.text('100 members');

            expect(find('[data-test-button="bulk-delete"')).to.exist;

            await click('[data-test-button="bulk-delete"');

            expect(find('[data-test-modal="delete-members"]')).to.exist;
            expect(find('[data-test-text="delete-confirmation"]')).to.contain.text('100 members');

            await click('[data-test-button="confirm"]');

            expect(find('[data-test-modal="delete-members')).to.not.exist;
            expect(find('[data-test-list-header]')).to.contain.text('5 members');
            expect(find('[data-test-dropdown="label-filter"]')).to.contain.text('All labels');
        });

        it('displays warning about paid members', async function () {
            this.server.createList('member', 5);
            let label = this.server.create('label');
            this.server.createList('member', 50, {labels: [label]});
            this.server.createList('member', 10, 'paid', {labels: [label]});
            this.server.createList('member', 15, 'paid'); // to ensure paid check is filtering by label
            await visit('/members');

            // sanity check on member count
            expect(find('[data-test-list-header]')).to.contain.text('80 members');

            await click('[data-test-dropdown="label-filter"]');
            await click(`[data-test-label-filter="${label.slug}"]`);

            // sanity check on member count
            expect(find('[data-test-list-header]')).to.contain.text('60 members');

            await click('[data-test-button="bulk-delete"');

            expect(find('[data-test-modal="delete-members"]')).to.exist;
            expect(find('[data-test-text="delete-confirmation"]')).to.contain.text('10 members');

            await click('[data-test-button="confirm"]');

            expect(find('[data-test-modal="delete-members')).to.not.exist;
            expect(find('[data-test-list-header]')).to.contain.text('20 members');
            expect(find('[data-test-dropdown="label-filter"]')).to.contain.text('All labels');
        });

        it('displays errors if any members fail to delete', async function () {
            // mock partial failure in DEL /members/
            this.server.del('/members/', {
                meta: {
                    stats: {
                        deleted: {
                            count: 2
                        },
                        invalid: {
                            count: 5,
                            errors: [
                                {
                                    message: 'Not found',
                                    count: 3
                                },
                                {
                                    message: 'Unknown error',
                                    count: 2
                                }
                            ]
                        }
                    }
                }
            });

            let label = this.server.create('label');
            this.server.createList('member', 12, {labels: [label]});

            await visit('/members');
            await click('[data-test-dropdown="label-filter"]');
            await click(`[data-test-label-filter="${label.slug}"]`);
            await click('[data-test-button="bulk-delete"');
            await click('[data-test-button="confirm"]');

            expect(find('[data-test-modal="delete-members"]')).to.exist;
            expect(find('[data-test-state="delete-complete"]')).to.exist;
            expect(find('[data-test-text="delete-count"]')).to.have.text('2');
            expect(find('[data-test-text="invalid-count"]')).to.have.text('5');
            expect(findAll('[data-test-delete-error]')).to.have.length(2);
            expect(findAll('[data-test-delete-error]')[0]).to.have.text('Not found (3)');
            expect(findAll('[data-test-delete-error]')[1]).to.have.text('Unknown error (2)');

            await click('[data-test-button="close-modal"]');

            expect(find('[data-test-modal="delete-members"]')).to.not.exist;
        });
    });
});
