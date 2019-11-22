import moment from 'moment';
import wait from 'ember-test-helpers/wait';
import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {beforeEach, describe, it} from 'mocha';
import {click, currentRouteName, currentURL, fillIn, find, findAll} from '@ember/test-helpers';
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
            expect(find('.gh-member-basic-settings-form input[name="name"]').value, 'loads correct member into form')
                .to.equal(member1.name);

            // trigger save
            await fillIn('.gh-member-basic-settings-form input[name="name"]', 'New Name');
            await blur('.gh-member-basic-settings-form input[name="name"]');

            await click('[data-test-button="save"]');

            // // extra timeout needed for Travis - sometimes it doesn't update
            // // quick enough and an extra wait() call doesn't help
            await timeout(100);

            await click('[data-test-link="members-back"]');

            await wait();

            // lands on correct page
            expect(currentURL(), 'currentURL').to.equal('/members');
        });
    });
});
