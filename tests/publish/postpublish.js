import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {beforeEach, describe, it} from 'mocha';
import {click, currentURL, fillIn, find, findAll, settled, visit} from '@ember/test-helpers';
import {clickTrigger, selectChoose} from 'ember-power-select/test-support/helpers';
import {expect} from 'chai';
import {setupApplicationTest} from 'ember-mocha';
import {setupMirage} from 'ember-cli-mirage/test-support';
//Author
describe('Post: Content', function () {
    let hooks = setupApplicationTest();
    setupMirage(hooks);

    it('vist the editor page', async function () {
        await invalidateSession();
        await visit('/ghost/#/posts');

        expect(currentURL()).to.equal('/ghost/#/posts');
    });

    it('Verify the post is published successfully' , async function () {
        await visit('/ghosts/#/posts');
        await click('.gh-secondary-action.gh-nav-new-post.ember-view');
        await fillIn('.gh-editor-title.ember-text-area.gh-input.ember-view', 'My new Title');
        await fillIn('div.koenig-editor__editor-wrapper > div', ' My new post');
        await click('.gh-publishmenu-trigger');
        await click('div.gh-publishmenu-radio.active > div.gh-publishmenu-radio-content > div.gh-publishmenu-radio-label');
        await click('.gh-publishmenu-button');
        await click('.items-center.ember-view');
        andThen(() => assert.equal(find('.gh-content-entry-title').text(), 'My new Title'));
});

    it('Verify the post can be scheduled for later publish' , async function(){

        await visit('/ghosts/#/posts');
        await click('.gh-secondary-action.gh-nav-new-post.ember-view');
        await fillIn('.gh-editor-title.ember-text-area.gh-input.ember-view', 'My new Title');
        await fillIn('div.koenig-editor__editor-wrapper > div', ' My new post');
        await click('.gh-publishmenu-trigger');
        await click('.ember-view .ember-basic-dropdown-trigger.ember-basic-dropdown-trigger--in-place.ember-power-datepicker-trigger', )
        await click('.gh-publishmenu-button');
        await click('.items-center.ember-view');
        andThen(() => assert.equal(find('.gh-content-entry-title').text(), 'My new Title'));
    })
    
});    




