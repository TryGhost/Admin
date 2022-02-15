import Mirage from 'ember-cli-mirage';
import ctrlOrCmd from 'ghost-admin/utils/ctrl-or-cmd';
import moment from 'moment';
import sinon from 'sinon';
import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {blur, click, currentRouteName, currentURL, fillIn, find, findAll, triggerEvent} from '@ember/test-helpers';
import {datepickerSelect} from 'ember-power-datepicker/test-support';
import {module, test} from 'qunit';
import {selectChoose} from 'ember-power-select/test-support';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../helpers/visit';

// TODO: update ember-power-datepicker to expose modern test helpers
// https://github.com/cibernox/ember-power-datepicker/issues/30

module('Acceptance: Editor', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    test('redirects to signin when not authenticated', async function (assert) {
        let author = this.server.create('user'); // necesary for post-author association
        this.server.create('post', {authors: [author]});

        await invalidateSession();
        await visit('/editor/post/1');

        assert.strictEqual(currentURL(), '/signin', 'currentURL');
    });

    test('does not redirect to staff page when authenticated as contributor', async function (assert) {
        let role = this.server.create('role', {name: 'Contributor'});
        let author = this.server.create('user', {roles: [role], slug: 'test-user'});
        this.server.create('post', {authors: [author]});

        await authenticateSession();
        await visit('/editor/post/1');

        assert.strictEqual(currentURL(), '/editor/post/1', 'currentURL');
    });

    test('does not redirect to staff page when authenticated as author', async function (assert) {
        let role = this.server.create('role', {name: 'Author'});
        let author = this.server.create('user', {roles: [role], slug: 'test-user'});
        this.server.create('post', {authors: [author]});

        await authenticateSession();
        await visit('/editor/post/1');

        assert.strictEqual(currentURL(), '/editor/post/1', 'currentURL');
    });

    test('does not redirect to staff page when authenticated as editor', async function (assert) {
        let role = this.server.create('role', {name: 'Editor'});
        let author = this.server.create('user', {roles: [role], slug: 'test-user'});
        this.server.create('post', {authors: [author]});

        await authenticateSession();
        await visit('/editor/post/1');

        assert.strictEqual(currentURL(), '/editor/post/1', 'currentURL');
    });

    test('displays 404 when post does not exist', async function (assert) {
        let role = this.server.create('role', {name: 'Editor'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/editor/post/1');

        assert.strictEqual(currentRouteName(), 'error404');
        assert.strictEqual(currentURL(), '/editor/post/1');
    });

    test('when logged in as a contributor, renders a save button instead of a publish menu & hides tags input', async function (assert) {
        let role = this.server.create('role', {name: 'Contributor'});
        let author = this.server.create('user', {roles: [role]});
        this.server.createList('post', 2, {authors: [author]});
        this.server.loadFixtures('settings');
        await authenticateSession();

        // post id 1 is a draft, checking for draft behaviour now
        await visit('/editor/post/1');

        assert.strictEqual(currentURL(), '/editor/post/1', 'currentURL');

        // Expect publish menu to not exist
        assert.dom('[data-test-publishmenu-trigger]').doesNotExist('publish menu trigger');

        // Open post settings menu
        await click('[data-test-psm-trigger]');

        // Check to make sure that tags input doesn't exist
        assert.dom('[data-test-token-input]').doesNotExist('tags input');

        // post id 2 is published, we should be redirected to index
        await visit('/editor/post/2');

        assert.strictEqual(currentURL(), '/posts', 'currentURL');
    });

    module('when logged in', function (hooks) {
        let author;

        hooks.beforeEach(async function () {
            let role = this.server.create('role', {name: 'Administrator'});
            author = this.server.create('user', {roles: [role]});
            this.server.loadFixtures('settings');

            return await authenticateSession();
        });

        test('renders the editor correctly, PSM Publish Date and Save Button', async function (assert) {
            let [post1] = this.server.createList('post', 2, {authors: [author]});
            let futureTime = moment().tz('Etc/UTC').add(10, 'minutes');

            // post id 1 is a draft, checking for draft behaviour now
            await visit('/editor/post/1');

            assert.strictEqual(currentURL(), '/editor/post/1', 'currentURL');

            // open post settings menu
            await click('[data-test-psm-trigger]');

            // should error, if the publish time is in the wrong format
            await fillIn('[data-test-date-time-picker-time-input]', 'foo');
            await blur('[data-test-date-time-picker-time-input]');

            assert.strictEqual(find('[data-test-date-time-picker-error]').textContent.trim(), 'Must be in format: "15:00"', 'inline error response for invalid time');

            // should error, if the publish time is in the future
            // NOTE: date must be selected first, changing the time first will save
            // with the new time
            await fillIn('[data-test-date-time-picker-datepicker] input', moment.tz('Etc/UTC').add(1, 'day').format('YYYY-MM-DD'));
            await blur('[data-test-date-time-picker-datepicker] input');
            await fillIn('[data-test-date-time-picker-time-input]', futureTime.format('HH:mm'));
            await blur('[data-test-date-time-picker-time-input]');

            assert.strictEqual(find('[data-test-date-time-picker-error]').textContent.trim(), 'Must be in the past', 'inline error response for future time');

            // closing the PSM will reset the invalid date/time
            await click('[data-test-psm-trigger]');
            await click('[data-test-psm-trigger]');

            assert.dom('[data-test-date-time-picker-error]').doesNotExist('date picker error after closing PSM');

            assert.strictEqual(find('[data-test-date-time-picker-date-input]').value, moment(post1.publishedAt).tz('Etc/UTC').format('YYYY-MM-DD'), 'PSM date value after closing with invalid date');

            assert.strictEqual(find('[data-test-date-time-picker-time-input]').value, moment(post1.publishedAt).tz('Etc/UTC').format('HH:mm'), 'PSM time value after closing with invalid date');

            // saves the post with the new date
            let validTime = moment('2017-04-09 12:00').tz('Etc/UTC');
            await fillIn('[data-test-date-time-picker-time-input]', validTime.format('HH:mm'));
            await blur('[data-test-date-time-picker-time-input]');
            await datepickerSelect('[data-test-date-time-picker-datepicker]', validTime.toDate());

            // hide psm
            await click('[data-test-psm-trigger]');

            // checking the flow of the saving button for a draft
            assert.strictEqual(find('[data-test-publishmenu-trigger]').textContent.trim(), 'Publish', 'draft publish button text');

            assert.match(find('[data-test-editor-post-status]').textContent.trim(), /Draft\s+- Saved/, 'draft status text');

            // click on publish now
            await click('[data-test-publishmenu-trigger]');

            assert.dom('[data-test-publishmenu-draft]').exists('draft publish menu is shown');

            await click('[data-test-publishmenu-scheduled-option]');

            assert.strictEqual(find('[data-test-publishmenu-save]').textContent.trim(), 'Schedule', 'draft post schedule button text');

            await click('[data-test-publishmenu-published-option]');

            assert.strictEqual(find('[data-test-publishmenu-save]').textContent.trim(), 'Publish', 'draft post publish button text');

            // Publish the post and re-open publish menu
            await click('[data-test-publishmenu-save]');

            assert.strictEqual(find('[data-test-publishmenu-save]').textContent.trim(), 'Update', 'publish menu save button updated after draft is published');

            assert.dom('[data-test-publishmenu-published]').exists('publish menu is shown after draft published');

            assert.strictEqual(find('[data-test-editor-post-status]').textContent.trim(), 'Published', 'post status updated after draft published');

            await click('[data-test-publishmenu-cancel]');
            await click('[data-test-publishmenu-trigger]');
            await click('[data-test-publishmenu-unpublished-option]');

            assert.strictEqual(find('[data-test-publishmenu-save]').textContent.trim(), 'Unpublish', 'published post unpublish button text');

            // post id 2 is a published post, checking for published post behaviour now
            await visit('/editor/post/2');
            assert.strictEqual(currentURL(), '/editor/post/2', 'currentURL');

            await click('[data-test-psm-trigger]');
            assert.strictEqual(find('[data-test-date-time-picker-date-input]').value, '2015-12-19');
            assert.strictEqual(find('[data-test-date-time-picker-time-input]').value, '16:25');

            // saves the post with a new date
            await datepickerSelect('[data-test-date-time-picker-datepicker]', moment('2016-05-10 10:00').toDate());
            await fillIn('[data-test-date-time-picker-time-input]', '10:00');
            await blur('[data-test-date-time-picker-time-input]');

            await click('[data-test-psm-trigger]');

            // saving
            await click('[data-test-publishmenu-trigger]');

            assert.strictEqual(find('[data-test-publishmenu-save]').textContent.trim(), 'Update', 'published button text');

            await click('[data-test-publishmenu-save]');

            assert.strictEqual(find('[data-test-publishmenu-save]').textContent.trim(), 'Update', 'publish menu save button updated after published post is updated');

            // go to settings to change the timezone
            await visit('/settings/general');
            await click('[data-test-toggle-timezone]');

            assert.strictEqual(currentURL(), '/settings/general', 'currentURL for settings');
            assert.strictEqual(find('#timezone option:checked').textContent.trim(), '(GMT) UTC', 'default timezone');

            // select a new timezone
            find('#timezone option[value="Pacific/Kwajalein"]').selected = true;

            await triggerEvent('#timezone', 'change');
            // save the settings
            await click('[data-test-button="save"]');

            assert.strictEqual(find('#timezone option:checked').textContent.trim(), '(GMT +12:00) International Date Line West', 'new timezone after saving');

            // and now go back to the editor
            await visit('/editor/post/2');

            assert.strictEqual(currentURL(), '/editor/post/2', 'currentURL in editor');

            await click('[data-test-psm-trigger]');
            assert.strictEqual(find('[data-test-date-time-picker-date-input]').value, '2016-05-10', 'date after timezone change');

            assert.strictEqual(find('[data-test-date-time-picker-time-input]').value, '22:00', 'time after timezone change');

            // unpublish
            await click('[data-test-publishmenu-trigger]');
            await click('[data-test-publishmenu-unpublished-option]');

            assert.strictEqual(find('[data-test-publishmenu-save]').textContent.trim(), 'Unpublish', 'published post unpublish button text');

            await click('[data-test-publishmenu-save]');

            assert.strictEqual(find('[data-test-publishmenu-save]').textContent.trim(), 'Publish', 'publish menu save button updated after published post is unpublished');

            assert.dom('[data-test-publishmenu-draft]').exists('draft menu is shown after unpublished');

            assert.match(find('[data-test-editor-post-status]').textContent.trim(), /Draft\s+- Saved/, 'post status updated after unpublished');

            // schedule post
            await click('[data-test-publishmenu-cancel]');
            await click('[data-test-publishmenu-trigger]');
            await click('[data-test-publishmenu-scheduled-option]');

            assert.strictEqual(find('[data-test-publishmenu-save]').textContent.trim(), 'Schedule', 'draft post, schedule button text');

            // get time in current timezone and select the current date
            // will result in the default +5mins schedule time
            let newFutureTime = moment.tz('Pacific/Kwajalein');
            await datepickerSelect('[data-test-publishmenu-draft] [data-test-date-time-picker-datepicker]', new Date(newFutureTime.format().replace(/\+.*$/, '')));
            await click('[data-test-publishmenu-save]');

            assert.strictEqual(find('[data-test-publishmenu-save]').textContent.trim(), 'Reschedule', 'publish menu save button updated after draft is scheduled');

            await click('[data-test-publishmenu-cancel]');

            assert.dom('[data-test-publishmenu-scheduled]').doesNotExist('publish menu is not shown after closed');

            // expect countdown to show warning that post is scheduled to be published
            assert.match(find('[data-test-schedule-countdown]').textContent.trim(), /Will be published\s+in (4|5) minutes/, 'notification countdown');

            assert.strictEqual(find('[data-test-publishmenu-trigger]').textContent.trim(), 'Scheduled', 'scheduled publish button text');

            assert.match(find('[data-test-editor-post-status]').textContent.trim(), /Will be published\s+in (4|5) minutes/, 'scheduled post status');

            // Re-schedule
            await click('[data-test-publishmenu-trigger]');
            await click('[data-test-publishmenu-scheduled-option]');
            assert.strictEqual(find('[data-test-publishmenu-save]').textContent.trim(), 'Reschedule', 'scheduled post button reschedule text');

            await click('[data-test-publishmenu-save]');

            assert.strictEqual(find('[data-test-publishmenu-save]').textContent.trim(), 'Reschedule', 'publish menu save button text for a rescheduled post');

            await click('[data-test-publishmenu-cancel]');

            assert.dom('[data-test-publishmenu-scheduled]').doesNotExist('publish menu is not shown after closed');

            assert.match(find('[data-test-editor-post-status]').textContent.trim(), /Will be published\s+in (4|5) minutes/, 'scheduled status text');

            // unschedule
            await click('[data-test-publishmenu-trigger]');
            await click('[data-test-publishmenu-draft-option]');

            assert.strictEqual(find('[data-test-publishmenu-save]').textContent.trim(), 'Unschedule', 'publish menu save button updated after scheduled post is unscheduled');

            await click('[data-test-publishmenu-save]');

            assert.strictEqual(find('[data-test-publishmenu-save]').textContent.trim(), 'Publish', 'publish menu save button updated after scheduled post is unscheduled');

            await click('[data-test-publishmenu-cancel]');

            assert.strictEqual(find('[data-test-publishmenu-trigger]').textContent.trim(), 'Publish', 'publish button text after unschedule');

            assert.match(find('[data-test-editor-post-status]').textContent.trim(), /Draft\s+- Saved/, 'status text after unschedule');

            assert.dom('[data-test-schedule-countdown]').doesNotExist('scheduled countdown after unschedule');
        });

        test('handles validation errors when scheduling', async function (assert) {
            this.server.put('/posts/:id/', function () {
                return new Mirage.Response(422, {}, {
                    errors: [{
                        type: 'ValidationError',
                        message: 'Error test'
                    }]
                });
            });

            let post = this.server.create('post', 1, {authors: [author], status: 'draft'});
            let plusTenMin = moment().utc().add(10, 'minutes');

            await visit(`/editor/post/${post.id}`);

            await click('[data-test-publishmenu-trigger]');
            await click('[data-test-publishmenu-scheduled-option]');
            await datepickerSelect('[data-test-publishmenu-draft] [data-test-date-time-picker-datepicker]', plusTenMin.toDate());
            await fillIn('[data-test-publishmenu-draft] [data-test-date-time-picker-time-input]', plusTenMin.format('HH:mm'));
            await blur('[data-test-publishmenu-draft] [data-test-date-time-picker-time-input]');

            await click('[data-test-publishmenu-save]');

            assert.strictEqual(findAll('.gh-alert').length, 1, 'number of alerts after failed schedule');

            assert.match(find('.gh-alert').textContent, /Error test/, 'alert text after failed schedule');
        });

        test('handles title validation errors correctly', async function (assert) {
            this.server.create('post', {authors: [author]});

            // post id 1 is a draft, checking for draft behaviour now
            await visit('/editor/post/1');

            assert.strictEqual(currentURL(), '/editor/post/1', 'currentURL');

            await fillIn('[data-test-editor-title-input]', Array(260).join('a'));
            await click('[data-test-publishmenu-trigger]');
            await click('[data-test-publishmenu-save]');

            assert.strictEqual(findAll('.gh-alert').length, 1, 'number of alerts after invalid title');

            assert.match(find('.gh-alert').textContent, /Title cannot be longer than 255 characters/, 'alert text after invalid title');
        });

        // NOTE: these tests are specific to the mobiledoc editor
        // it('inserts a placeholder if the title is blank', async function () {
        //     this.server.createList('post', 1);
        //
        //     // post id 1 is a draft, checking for draft behaviour now
        //     await visit('/editor/post/1');
        //
        //     expect(currentURL(), 'currentURL')
        //         .to.equal('/editor/post/1');
        //
        //     await titleRendered();
        //
        //     let title = find('#koenig-title-input div');
        //     expect(title.data('placeholder')).to.equal('Your Post Title');
        //     expect(title.hasClass('no-content')).to.be.false;
        //
        //     await replaceTitleHTML('');
        //     expect(title.hasClass('no-content')).to.be.true;
        //
        //     await replaceTitleHTML('test');
        //     expect(title.hasClass('no-content')).to.be.false;
        // });
        //
        // it('removes HTML from the title.', async function () {
        //     this.server.createList('post', 1);
        //
        //     // post id 1 is a draft, checking for draft behaviour now
        //     await visit('/editor/post/1');
        //
        //     expect(currentURL(), 'currentURL')
        //         .to.equal('/editor/post/1');
        //
        //     await titleRendered();
        //
        //     let title = find('#koenig-title-input div');
        //     await replaceTitleHTML('<div>TITLE&nbsp;&#09;&nbsp;&thinsp;&ensp;&emsp;TEST</div>&nbsp;');
        //     expect(title.html()).to.equal('TITLE      TEST ');
        // });

        test('renders first countdown notification before scheduled time', async function (assert) {
            let clock = sinon.useFakeTimers(moment().valueOf());
            let compareDate = moment().tz('Etc/UTC').add(4, 'minutes');
            let compareDateString = compareDate.format('YYYY-MM-DD');
            let compareTimeString = compareDate.format('HH:mm');
            this.server.create('post', {publishedAt: moment.utc().add(4, 'minutes'), status: 'scheduled', authors: [author]});
            this.server.create('setting', {timezone: 'Europe/Dublin'});
            clock.restore();

            await visit('/editor/post/1');

            assert.strictEqual(currentURL(), '/editor/post/1', 'currentURL');

            await click('[data-test-psm-trigger]');

            assert.strictEqual(find('[data-test-date-time-picker-date-input]').value, compareDateString, 'scheduled date');
            assert.strictEqual(find('[data-test-date-time-picker-time-input]').value, compareTimeString, 'scheduled time');
            // Dropdown menu should be 'Update Post' and 'Unschedule'
            assert.strictEqual(find('[data-test-publishmenu-trigger]').textContent.trim(), 'Scheduled', 'text in save button for scheduled post');
            // expect countdown to show warning, that post is scheduled to be published
            assert.match(find('[data-test-schedule-countdown]').textContent.trim(), /Will be published\s+in (4|5) minutes/, 'notification countdown');
        });

        test('shows author token input and allows changing of authors in PSM', async function (assert) {
            let adminRole = this.server.create('role', {name: 'Adminstrator'});
            let authorRole = this.server.create('role', {name: 'Author'});
            let user1 = this.server.create('user', {name: 'Primary', roles: [adminRole]});
            this.server.create('user', {name: 'Waldo', roles: [authorRole]});
            this.server.create('post', {authors: [user1]});

            await visit('/editor/post/1');

            assert.strictEqual(currentURL(), '/editor/post/1', 'currentURL');

            await click('[data-test-psm-trigger]');

            let tokens = findAll('[data-test-input="authors"] .ember-power-select-multiple-option');

            assert.strictEqual(tokens.length, 1);
            assert.includes(tokens[0].textContent.trim(), 'Primary');

            await selectChoose('[data-test-input="authors"]', 'Waldo');

            let savedAuthors = this.server.schema.posts.find('1').authors.models;

            assert.strictEqual(savedAuthors.length, 2);
            assert.strictEqual(savedAuthors[0].name, 'Primary');
            assert.strictEqual(savedAuthors[1].name, 'Waldo');
        });

        test('saves post settings fields', async function (assert) {
            let post = this.server.create('post', {authors: [author]});

            await visit(`/editor/post/${post.id}`);

            // TODO: implement tests for other fields

            await click('[data-test-psm-trigger]');

            // excerpt has validation
            await fillIn('[data-test-field="custom-excerpt"]', Array(302).join('a'));
            await blur('[data-test-field="custom-excerpt"]');

            assert.match(find('[data-test-error="custom-excerpt"]').textContent.trim(), /cannot be longer than 300/, 'excerpt too long error');

            assert.notOk(this.server.db.posts.find(post.id).customExcerpt, 'saved excerpt after validation error');

            // changing custom excerpt auto-saves
            await fillIn('[data-test-field="custom-excerpt"]', 'Testing excerpt');
            await blur('[data-test-field="custom-excerpt"]');

            assert.strictEqual(this.server.db.posts.find(post.id).customExcerpt, 'Testing excerpt', 'saved excerpt');

            // -------

            // open code injection subview
            await click('[data-test-button="codeinjection"]');

            // header injection has validation
            let headerCM = find('[data-test-field="codeinjection-head"] .CodeMirror').CodeMirror;
            await headerCM.setValue(Array(65540).join('a'));
            await click(headerCM.getInputField());
            await blur(headerCM.getInputField());

            assert.match(find('[data-test-error="codeinjection-head"]').textContent.trim(), /cannot be longer than 65535/, 'header injection too long error');

            assert.notOk(this.server.db.posts.find(post.id).codeinjectionHead, 'saved header injection after validation error');

            // changing header injection auto-saves
            await headerCM.setValue('<script src="http://example.com/inject-head.js"></script>');
            await click(headerCM.getInputField());
            await blur(headerCM.getInputField());

            assert.strictEqual(this.server.db.posts.find(post.id).codeinjectionHead, '<script src="http://example.com/inject-head.js"></script>', 'saved header injection');

            // footer injection has validation
            let footerCM = find('[data-test-field="codeinjection-foot"] .CodeMirror').CodeMirror;
            await footerCM.setValue(Array(65540).join('a'));
            await click(footerCM.getInputField());
            await blur(footerCM.getInputField());

            assert.match(find('[data-test-error="codeinjection-foot"]').textContent.trim(), /cannot be longer than 65535/, 'footer injection too long error');

            assert.notOk(this.server.db.posts.find(post.id).codeinjectionFoot, 'saved footer injection after validation error');

            // changing footer injection auto-saves
            await footerCM.setValue('<script src="http://example.com/inject-foot.js"></script>');
            await click(footerCM.getInputField());
            await blur(footerCM.getInputField());

            assert.strictEqual(this.server.db.posts.find(post.id).codeinjectionFoot, '<script src="http://example.com/inject-foot.js"></script>', 'saved footer injection');

            // closing subview switches back to main PSM view
            await click('[data-test-button="close-psm-subview"]');

            assert.strictEqual(findAll('[data-test-field="codeinjection-head"]').length, 0, 'header injection not present after closing subview');

            // -------

            // open twitter data subview
            await click('[data-test-button="twitter-data"]');

            // twitter title has validation
            await click('[data-test-field="twitter-title"]');
            await fillIn('[data-test-field="twitter-title"]', Array(302).join('a'));
            await blur('[data-test-field="twitter-title"]');

            assert.match(find('[data-test-error="twitter-title"]').textContent.trim(), /cannot be longer than 300/, 'twitter title too long error');

            assert.notOk(this.server.db.posts.find(post.id).twitterTitle, 'saved twitter title after validation error');

            // changing twitter title auto-saves
            // twitter title has validation
            await click('[data-test-field="twitter-title"]');
            await fillIn('[data-test-field="twitter-title"]', 'Test Twitter Title');
            await blur('[data-test-field="twitter-title"]');

            assert.strictEqual(this.server.db.posts.find(post.id).twitterTitle, 'Test Twitter Title', 'saved twitter title');

            // twitter description has validation
            await click('[data-test-field="twitter-description"]');
            await fillIn('[data-test-field="twitter-description"]', Array(505).join('a'));
            await blur('[data-test-field="twitter-description"]');

            assert.match(find('[data-test-error="twitter-description"]').textContent.trim(), /cannot be longer than 500/, 'twitter description too long error');

            assert.notOk(this.server.db.posts.find(post.id).twitterDescription, 'saved twitter description after validation error');

            // changing twitter description auto-saves
            // twitter description has validation
            await click('[data-test-field="twitter-description"]');
            await fillIn('[data-test-field="twitter-description"]', 'Test Twitter Description');
            await blur('[data-test-field="twitter-description"]');

            assert.strictEqual(this.server.db.posts.find(post.id).twitterDescription, 'Test Twitter Description', 'saved twitter description');

            // closing subview switches back to main PSM view
            await click('[data-test-button="close-psm-subview"]');

            assert.strictEqual(findAll('[data-test-field="twitter-title"]').length, 0, 'twitter title not present after closing subview');

            // -------

            // open facebook data subview
            await click('[data-test-button="facebook-data"]');

            // facebook title has validation
            await click('[data-test-field="og-title"]');
            await fillIn('[data-test-field="og-title"]', Array(302).join('a'));
            await blur('[data-test-field="og-title"]');

            assert.match(find('[data-test-error="og-title"]').textContent.trim(), /cannot be longer than 300/, 'facebook title too long error');

            assert.notOk(this.server.db.posts.find(post.id).ogTitle, 'saved facebook title after validation error');

            // changing facebook title auto-saves
            // facebook title has validation
            await click('[data-test-field="og-title"]');
            await fillIn('[data-test-field="og-title"]', 'Test Facebook Title');
            await blur('[data-test-field="og-title"]');

            assert.strictEqual(this.server.db.posts.find(post.id).ogTitle, 'Test Facebook Title', 'saved facebook title');

            // facebook description has validation
            await click('[data-test-field="og-description"]');
            await fillIn('[data-test-field="og-description"]', Array(505).join('a'));
            await blur('[data-test-field="og-description"]');

            assert.match(find('[data-test-error="og-description"]').textContent.trim(), /cannot be longer than 500/, 'facebook description too long error');

            assert.notOk(this.server.db.posts.find(post.id).ogDescription, 'saved facebook description after validation error');

            // changing facebook description auto-saves
            // facebook description has validation
            await click('[data-test-field="og-description"]');
            await fillIn('[data-test-field="og-description"]', 'Test Facebook Description');
            await blur('[data-test-field="og-description"]');

            assert.strictEqual(this.server.db.posts.find(post.id).ogDescription, 'Test Facebook Description', 'saved facebook description');

            // closing subview switches back to main PSM view
            await click('[data-test-button="close-psm-subview"]');

            assert.strictEqual(findAll('[data-test-field="og-title"]').length, 0, 'facebook title not present after closing subview');
        });

        // https://github.com/TryGhost/Ghost/issues/11786
        test('save shortcut works when tags/authors field is focused', async function (assert) {
            let post = this.server.create('post', {authors: [author]});

            await visit(`/editor/post/${post.id}`);
            await fillIn('[data-test-editor-title-input]', 'CMD-S Test');

            await click('[data-test-psm-trigger]');
            await click('[data-test-token-input]');

            await triggerEvent('[data-test-token-input]', 'keydown', {
                keyCode: 83, // s
                metaKey: ctrlOrCmd === 'command',
                ctrlKey: ctrlOrCmd === 'ctrl'
            });

            // Check if save request has been sent correctly.
            let [lastRequest] = this.server.pretender.handledRequests.slice(-1);
            let body = JSON.parse(lastRequest.requestBody);
            assert.strictEqual(body.posts[0].title, 'CMD-S Test');
        });
    });
});
