/* jshint expr:true */
import Mirage from 'ember-cli-mirage';
import destroyApp from '../helpers/destroy-app';
import moment from 'moment';
import sinon from 'sinon';
import startApp from '../helpers/start-app';
import testSelector from 'ember-test-selectors';
import {afterEach, beforeEach, describe, it} from 'mocha';
import {authenticateSession, invalidateSession} from 'ghost-admin/tests/helpers/ember-simple-auth';
import {expect} from 'chai';

describe('Acceptance: Editor', function() {
    let application;

    beforeEach(function() {
        application = startApp();
    });

    afterEach(function() {
        destroyApp(application);
    });

    it('redirects to signin when not authenticated', async function () {
        server.create('user'); // necesary for post-author association
        server.create('post');

        invalidateSession(application);
        await visit('/editor/1');

        expect(currentURL(), 'currentURL').to.equal('/signin');
    });

    it('does not redirect to team page when authenticated as author', async function () {
        let role = server.create('role', {name: 'Author'});
        server.create('user', {roles: [role], slug: 'test-user'});
        server.create('post');

        authenticateSession(application);
        await visit('/editor/1');

        expect(currentURL(), 'currentURL').to.equal('/editor/1');
    });

    it('does not redirect to team page when authenticated as editor', async function () {
        let role = server.create('role', {name: 'Editor'});
        server.create('user', {roles: [role], slug: 'test-user'});
        server.create('post');

        authenticateSession(application);
        await visit('/editor/1');

        expect(currentURL(), 'currentURL').to.equal('/editor/1');
    });

    it('displays 404 when post does not exist', async function () {
        let role = server.create('role', {name: 'Editor'});
        server.create('user', {roles: [role], slug: 'test-user'});

        authenticateSession(application);
        await visit('/editor/1');

        expect(currentPath()).to.equal('error404');
        expect(currentURL()).to.equal('/editor/1');
    });

    describe('when logged in', function () {
        beforeEach(function () {
            let role = server.create('role', {name: 'Administrator'});
            server.create('user', {roles: [role]});
            server.loadFixtures('settings');

            return authenticateSession(application);
        });

        it('renders the editor correctly, PSM Publish Date and Save Button', async function () {
            let [post1] = server.createList('post', 2);
            let futureTime = moment().tz('Etc/UTC').add(10, 'minutes');

            // post id 1 is a draft, checking for draft behaviour now
            await visit('/editor/1');

            expect(currentURL(), 'currentURL')
                .to.equal('/editor/1');

            // open post settings menu
            await click(testSelector('psm-trigger'));

            // should error, if the publish time is in the wrong format
            await fillIn(testSelector('date-time-picker-time-input'), 'foo');
            await triggerEvent(testSelector('date-time-picker-time-input'), 'blur');

            expect(find(testSelector('date-time-picker-error')).text().trim(), 'inline error response for invalid time')
                .to.equal('Must be in format: "15:00"');

            // should error, if the publish time is in the future
            // NOTE: date must be selected first, changing the time first will save
            // with the new time
            await datepickerSelect(testSelector('date-time-picker-datepicker'), moment.tz('Etc/UTC'));
            await fillIn(testSelector('date-time-picker-time-input'), futureTime.format('HH:mm'));
            await triggerEvent(testSelector('date-time-picker-time-input'), 'blur');

            expect(find(testSelector('date-time-picker-error')).text().trim(), 'inline error response for future time')
                .to.equal('Must be in the past');

            // closing the PSM will reset the invalid date/time
            await click(testSelector('close-settings-menu'));
            await click(testSelector('psm-trigger'));

            expect(
                find(testSelector('date-time-picker-error')).text().trim(),
                'date picker error after closing PSM'
            ).to.equal('');

            expect(
                find(testSelector('date-time-picker-date-input')).val(),
                'PSM date value after closing with invalid date'
            ).to.equal(moment(post1.publishedAt).format('MM/DD/YYYY'));

            expect(
                find(testSelector('date-time-picker-time-input')).val(),
                'PSM time value after closing with invalid date'
            ).to.equal(moment(post1.publishedAt).format('HH:mm'));

            // saves the post with the new date
            let validTime = moment('2017-04-09 12:00');
            await fillIn(testSelector('date-time-picker-time-input'), validTime.format('HH:mm'));
            await triggerEvent(testSelector('date-time-picker-time-input'), 'blur');
            await datepickerSelect(testSelector('date-time-picker-datepicker'), validTime);

            // hide psm
            await click(testSelector('psm-trigger'));

            // checking the flow of the saving button for a draft
            expect(
                find(testSelector('publishmenu-trigger')).text().trim(),
                'draft publish button text'
            ).to.equal('Publish');

            expect(
                find(testSelector('editor-post-status')).text().trim(),
                'draft status text'
            ).to.equal('Draft');

            // click on publish now
            await click(testSelector('publishmenu-trigger'));

            expect(
                find(testSelector('publishmenu-draft')),
                'draft publish menu is shown'
            ).to.exist;

            await click(testSelector('publishmenu-scheduled-option'));

            expect(
                find(testSelector('publishmenu-save')).text().trim(),
                'draft post schedule button text'
            ).to.equal('Schedule');

            await click(testSelector('publishmenu-published-option'));

            expect(
                find(testSelector('publishmenu-save')).text().trim(),
                'draft post publish button text'
            ).to.equal('Publish');

            // Publish the post
            await click(testSelector('publishmenu-save'));

            expect(
                find(testSelector('publishmenu-save')).text().trim(),
                'publish menu save button updated after draft is published'
            ).to.equal('Published');

            expect(
                find(testSelector('publishmenu-published')),
                'publish menu is shown after draft published'
            ).to.exist;

            expect(
                find(testSelector('editor-post-status')).text().trim(),
                'post status updated after draft published'
            ).to.equal('Published');

            await click(testSelector('publishmenu-cancel'));
            await click(testSelector('publishmenu-trigger'));
            await click(testSelector('publishmenu-unpublished-option'));

            expect(
                find(testSelector('publishmenu-save')).text().trim(),
                'published post unpublish button text'
            ).to.equal('Unpublish');

            // post id 2 is a published post, checking for published post behaviour now
            await visit('/editor/2');

            expect(currentURL(), 'currentURL').to.equal('/editor/2');
            expect(find(testSelector('date-time-picker-date-input')).val()).to.equal('12/19/2015');
            expect(find(testSelector('date-time-picker-time-input')).val()).to.equal('16:25');

            // saves the post with a new date
            await datepickerSelect(testSelector('date-time-picker-datepicker'), moment('2016-05-10 10:00'));
            await fillIn(testSelector('date-time-picker-time-input'), '10:00');
            await triggerEvent(testSelector('date-time-picker-time-input'), 'blur');
            // saving
            await click(testSelector('publishmenu-trigger'));

            expect(
                find(testSelector('publishmenu-save')).text().trim(),
                'published button text'
            ).to.equal('Update');

            await click(testSelector('publishmenu-save'));

            expect(
                find(testSelector('publishmenu-save')).text().trim(),
                'publish menu save button updated after published post is updated'
            ).to.equal('Updated');

            // go to settings to change the timezone
            await visit('/settings/general');
            await click(testSelector('toggle-timezone'));

            expect(currentURL(), 'currentURL for settings')
                .to.equal('/settings/general');
            expect(find('#activeTimezone option:selected').text().trim(), 'default timezone')
                .to.equal('(GMT) UTC');

            // select a new timezone
            find('#activeTimezone option[value="Pacific/Kwajalein"]').prop('selected', true);

            await triggerEvent('#activeTimezone', 'change');
            // save the settings
            await click('.gh-btn.gh-btn-blue');

            expect(find('#activeTimezone option:selected').text().trim(), 'new timezone after saving')
                .to.equal('(GMT +12:00) International Date Line West');

            // and now go back to the editor
            await visit('/editor/2');

            expect(currentURL(), 'currentURL in editor')
                .to.equal('/editor/2');

            expect(
                find(testSelector('date-time-picker-date-input')).val(),
                'date after timezone change'
            ).to.equal('05/10/2016');

            expect(
                find(testSelector('date-time-picker-time-input')).val(),
                'time after timezone change'
            ).to.equal('22:00');

            // unpublish
            await click(testSelector('publishmenu-trigger'));
            await click(testSelector('publishmenu-unpublished-option'));

            expect(
                find(testSelector('publishmenu-save')).text().trim(),
                'published post unpublish button text'
            ).to.equal('Unpublish');

            await click(testSelector('publishmenu-save'));

            expect(
                find(testSelector('publishmenu-save')).text().trim(),
                'publish menu save button updated after published post is unpublished'
            ).to.equal('Unpublished');

            expect(
                find(testSelector('publishmenu-draft')),
                'draft menu is shown after unpublished'
            ).to.exist;

            expect(
                find(testSelector('editor-post-status')).text().trim(),
                'post status updated after unpublished'
            ).to.equal('Draft');

            // schedule post
            await click(testSelector('publishmenu-cancel'));
            await click(testSelector('publishmenu-trigger'));

            let newFutureTime = moment.tz('Pacific/Kwajalein').add(10, 'minutes');
            await click(testSelector('publishmenu-scheduled-option'));

            expect(
                find(testSelector('publishmenu-save')).text().trim(),
                'draft post, schedule button text'
            ).to.equal('Schedule');

            await datepickerSelect(`${testSelector('publishmenu-draft')} ${testSelector('date-time-picker-datepicker')}`, newFutureTime);
            await click(testSelector('publishmenu-save'));

            expect(
                find(testSelector('publishmenu-save')).text().trim(),
                'publish menu save button updated after draft is scheduled'
            ).to.equal('Scheduled');

            await click(testSelector('publishmenu-cancel'));

            expect(
                find(testSelector('publishmenu-scheduled')),
                'publish menu is not shown after closed'
            ).to.not.exist;

            // expect countdown to show warning, that post will be published in x minutes
            expect(find(testSelector('schedule-countdown')).text().trim(), 'notification countdown')
                .to.contain('Post will be published in');

            expect(
                find(testSelector('publishmenu-trigger')).text().trim(),
                'scheduled publish button text'
            ).to.equal('Scheduled');

            expect(
                find(testSelector('editor-post-status')).text().trim(),
                'scheduled post status'
            ).to.equal('Scheduled');

            // Re-schedule
            await click(testSelector('publishmenu-trigger'));
            await click(testSelector('publishmenu-scheduled-option'));
            expect(
                find(testSelector('publishmenu-save')).text().trim(),
                'scheduled post button reschedule text'
            ).to.equal('Reschedule');

            await click(testSelector('publishmenu-save'));

            expect(
                find(testSelector('publishmenu-save')).text().trim(),
                'publish menu save button text for a rescheduled post'
            ).to.equal('Rescheduled');

            await click(testSelector('publishmenu-cancel'));

            expect(
                find(testSelector('publishmenu-scheduled')),
                'publish menu is not shown after closed'
            ).to.not.exist;

            expect(
                find(testSelector('editor-post-status')).text().trim(),
                'scheduled status text'
            ).to.equal('Scheduled');

            // unschedule
            await click(testSelector('publishmenu-trigger'));
            await click(testSelector('publishmenu-draft-option'));

            expect(
                find(testSelector('publishmenu-save')).text().trim(),
                'publish menu save button updated after scheduled post is unscheduled'
            ).to.equal('Unschedule');

            await click(testSelector('publishmenu-save'));

            expect(
                find(testSelector('publishmenu-save')).text().trim(),
                'publish menu save button updated after scheduled post is unscheduled'
            ).to.equal('Unscheduled');

            await click(testSelector('publishmenu-cancel'));

            expect(
                find(testSelector('publishmenu-trigger')).text().trim(),
                'publish button text after unschedule'
            ).to.equal('Publish');

            expect(
                find(testSelector('editor-post-status')).text().trim(),
                'status text after unschedule'
            ).to.equal('Draft');

            expect(
                find(testSelector('schedule-countdown')),
                'scheduled countdown after unschedule'
            ).to.not.exist;
        });

        it('handles validation errors when scheduling', async function () {
            server.put('/posts/:id/', function () {
                return new Mirage.Response(422, {}, {
                    errors: [{
                        errorType: 'ValidationError',
                        message: 'Error test'
                    }]
                });
            });

            let post = server.create('post', 1);
            let plusTenMin = moment().utc().add(10, 'minutes');

            await visit(`/editor/${post.id}`);

            await click(testSelector('publishmenu-trigger'));
            await click(testSelector('publishmenu-scheduled-option'));
            await datepickerSelect(`${testSelector('publishmenu-draft')} ${testSelector('date-time-picker-datepicker')}`, plusTenMin);
            await fillIn(`${testSelector('publishmenu-draft')} ${testSelector('date-time-picker-time-input')}`, plusTenMin.format('HH:mm'));
            await triggerEvent(`${testSelector('publishmenu-draft')} ${testSelector('date-time-picker-time-input')}`, 'blur');
            await click(testSelector('publishmenu-save'));

            expect(
                find('.gh-alert').length,
                'number of alerts after failed schedule'
            ).to.equal(1);

            expect(
                find('.gh-alert').text(),
                'alert text after failed schedule'
            ).to.match(/Saving failed: Error test/);
        });

        it('handles title validation errors correctly', async function () {
            server.createList('post', 1);

            // post id 1 is a draft, checking for draft behaviour now
            await visit('/editor/1');

            expect(currentURL(), 'currentURL')
                .to.equal('/editor/1');

            await fillIn(testSelector('editor-title-input'), Array(260).join('a'));
            await click(testSelector('publishmenu-trigger'));
            await click(testSelector('publishmenu-save'));

            expect(
                find('.gh-alert').length,
                'number of alerts after invalid title'
            ).to.equal(1);

            expect(
                find('.gh-alert').text(),
                'alert text after invalid title'
            ).to.match(/Title cannot be longer than 255 characters/);
        });

        // NOTE: these tests are specific to the mobiledoc editor
        // it('inserts a placeholder if the title is blank', async function () {
        //     server.createList('post', 1);
        //
        //     // post id 1 is a draft, checking for draft behaviour now
        //     await visit('/editor/1');
        //
        //     expect(currentURL(), 'currentURL')
        //         .to.equal('/editor/1');
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
        //     server.createList('post', 1);
        //
        //     // post id 1 is a draft, checking for draft behaviour now
        //     await visit('/editor/1');
        //
        //     expect(currentURL(), 'currentURL')
        //         .to.equal('/editor/1');
        //
        //     await titleRendered();
        //
        //     let title = find('#koenig-title-input div');
        //     await replaceTitleHTML('<div>TITLE&nbsp;&#09;&nbsp;&thinsp;&ensp;&emsp;TEST</div>&nbsp;');
        //     expect(title.html()).to.equal('TITLE      TEST ');
        // });

        it('renders first countdown notification before scheduled time', async function () {
            let clock = sinon.useFakeTimers(moment().valueOf());
            let compareDate = moment().tz('Etc/UTC').add(4, 'minutes');
            let compareDateString = compareDate.format('MM/DD/YYYY');
            let compareTimeString = compareDate.format('HH:mm');
            server.create('post', {publishedAt: moment.utc().add(4, 'minutes'), status: 'scheduled'});
            server.create('setting', {activeTimezone: 'Europe/Dublin'});
            clock.restore();

            await visit('/editor/1');

            expect(currentURL(), 'currentURL')
                .to.equal('/editor/1');
            expect(find(testSelector('date-time-picker-date-input')).val(), 'scheduled date')
                .to.equal(compareDateString);
            expect(find(testSelector('date-time-picker-time-input')).val(), 'scheduled time')
                .to.equal(compareTimeString);
            // Dropdown menu should be 'Update Post' and 'Unschedule'
            expect(find(testSelector('publishmenu-trigger')).text().trim(), 'text in save button for scheduled post')
                .to.equal('Scheduled');
            // expect countdown to show warning, that post will be published in x minutes
            expect(find(testSelector('schedule-countdown')).text().trim(), 'notification countdown')
                .to.contain('Post will be published in');
        });

        it('shows author list and allows switching of author in PSM', async function () {
            server.create('post', {authorId: 1});
            let role = server.create('role', {name: 'Author'});
            let author = server.create('user', {name: 'Waldo', roles: [role]});

            await visit('/editor/1');

            expect(currentURL(), 'currentURL')
                .to.equal('/editor/1');

            await click('button.post-settings');

            expect(find('select[name="post-setting-author"]').val()).to.equal('1');
            expect(find('select[name="post-setting-author"] option[value="2"]')).to.be.ok;

            await fillIn('select[name="post-setting-author"]', '2');

            expect(find('select[name="post-setting-author"]').val()).to.equal('2');
            expect(server.db.posts[0].authorId).to.equal(author.id);
        });

        it('autosaves when title loses focus', async function () {
            let role = server.create('role', {name: 'Administrator'});
            server.create('user', {name: 'Admin', roles: [role]});

            await visit('/editor');

            // NOTE: there were checks here for the title element having focus
            // but they were very temperamental whilst running tests in the
            // browser so they've been left out for now

            expect(
                currentURL(),
                'url on initial visit'
            ).to.equal('/editor');

            await triggerEvent(testSelector('editor-title-input'), 'blur');

            expect(
                find(testSelector('editor-title-input')).val(),
                'title value after autosave'
            ).to.equal('(Untitled)');

            expect(
                currentURL(),
                'url after autosave'
            ).to.equal('/editor/1');
        });

        it('saves post settings fields', async function () {
            let post = server.create('post');

            await visit(`/editor/${post.id}`);

            // TODO: implement tests for other fields

            await click(testSelector('psm-trigger'));

            // excerpt has validation
            await fillIn(testSelector('field', 'custom-excerpt'), Array(302).join('a'));
            await triggerEvent(testSelector('field', 'custom-excerpt'), 'blur');

            expect(
                find(testSelector('error', 'custom-excerpt')).text().trim(),
                'excerpt too long error'
            ).to.match(/cannot be longer than 300/);

            expect(
                server.db.posts[0].custom_excerpt,
                'saved excerpt after validation error'
            ).to.be.blank;

            // changing custom excerpt auto-saves
            await fillIn(testSelector('field', 'custom-excerpt'), 'Testing excerpt');
            await triggerEvent(testSelector('field', 'custom-excerpt'), 'blur');

            expect(
                server.db.posts[0].custom_excerpt,
                'saved excerpt'
            ).to.equal('Testing excerpt');

            // -------

            // open code injection subview
            await click(testSelector('button', 'codeinjection'));

            // header injection has validation
            let headerCM = find(`${testSelector('field', 'codeinjection-head')} .CodeMirror`)[0].CodeMirror;
            await headerCM.setValue(Array(65540).join('a'));
            await triggerEvent(headerCM.getInputField(), 'blur');

            expect(
                find(testSelector('error', 'codeinjection-head')).text().trim(),
                'header injection too long error'
            ).to.match(/cannot be longer than 65535/);

            expect(
                server.db.posts[0].codeinjection_head,
                'saved header injection after validation error'
            ).to.be.blank;

            // changing header injection auto-saves
            await headerCM.setValue('<script src="http://example.com/inject-head.js"></script>');
            await triggerEvent(headerCM.getInputField(), 'blur');

            expect(
                server.db.posts[0].codeinjection_head,
                'saved header injection'
            ).to.equal('<script src="http://example.com/inject-head.js"></script>');

            // footer injection has validation
            let footerCM = find(`${testSelector('field', 'codeinjection-foot')} .CodeMirror`)[0].CodeMirror;
            await footerCM.setValue(Array(65540).join('a'));
            await triggerEvent(footerCM.getInputField(), 'blur');

            expect(
                find(testSelector('error', 'codeinjection-foot')).text().trim(),
                'footer injection too long error'
            ).to.match(/cannot be longer than 65535/);

            expect(
                server.db.posts[0].codeinjection_foot,
                'saved footer injection after validation error'
            ).to.be.blank;

            // changing footer injection auto-saves
            await footerCM.setValue('<script src="http://example.com/inject-foot.js"></script>');
            await triggerEvent(footerCM.getInputField(), 'blur');

            expect(
                server.db.posts[0].codeinjection_foot,
                'saved footer injection'
            ).to.equal('<script src="http://example.com/inject-foot.js"></script>');

            // closing subview switches back to main PSM view
            await click(testSelector('button', 'close-psm-subview'));

            expect(
                find(testSelector('field', 'codeinjection-head')).length,
                'header injection not present after closing subview'
            ).to.equal(0);
        });
    });
});
