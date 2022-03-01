import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {click, currentRouteName, currentURL, find, findAll} from '@ember/test-helpers';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {setupApplicationTest} from 'ember-mocha';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../../helpers/visit';

describe('Acceptance: Tags', function () {
    let hooks = setupApplicationTest();
    setupMirage(hooks);

    it('redirects to signin when not authenticated', async function () {
        await invalidateSession();
        await visit('/tags');

        expect(currentURL(), 'currentURL').to.equal('/signin');
    });

    it('redirects to posts page when authenticated as contributor', async function () {
        let role = this.server.create('role', {name: 'Contributor'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/tags');

        expect(currentURL(), 'currentURL').to.equal('/posts');
    });

    it('redirects to site page when authenticated as author', async function () {
        let role = this.server.create('role', {name: 'Author'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/tags');

        expect(currentURL(), 'currentURL').to.equal('/site');
    });

    describe('when logged in', function () {
        it('it renders and displays tags on correct list', async function () {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            let tag1 = this.server.create('tag');
            let internalTag = this.server.create('tag', {name: '#internal-tag', slug: 'hash-internal-tag', visibility: 'internal'});

            await authenticateSession();
            await visit('/tags');

            // it edoesn't redirect to first tag
            expect(currentURL(), 'currentURL').to.equal('/tags');

            // it has correct page title
            expect(document.title, 'page title').to.equal('Tags - Test Blog');

            // it highlights nav menu
            expect(find('[data-test-nav="tags"]'), 'highlights nav menu item')
                .to.have.class('active');

            // it expects the Public tags button to be selected
            expect(find('.gh-contentfilter .gh-btn-group-selected span').textContent, 'public tags button')
                .to.equal('Public tags');

            // expect to find tag1 with correct title, slug and zero posts
            let tag = find('.tags-list .gh-tags-list-item');
            expect(tag.querySelector('.gh-tag-list-name').textContent, 'tag list item title')
                .to.equal(tag1.name);
            expect(tag.querySelector('.gh-tag-list-slug span').textContent, 'tag list item tag')
                .to.equal(tag1.slug);
            expect(tag.querySelector('.gh-tag-list-posts-count span').textContent, 'tag list item post count')
                .to.equal('0 posts');

            // move over to internal tags
            await visit('/tags?type=internal');
            // it expects the Internal tags button to be selected
            expect(find('.gh-contentfilter .gh-btn-group-selected span').textContent, 'internal tags button')
                .to.equal('Internal tags');

            // ensure the nav menu is still highlighted
            expect(find('[data-test-nav="tags"]'), 'highlights nav menu item')
                .to.have.class('active');

            // expect to find internalTag with correct title and slug
            let tag2 = find('.tags-list .gh-tags-list-item');
            expect(tag2.querySelector('.gh-tag-list-name').textContent, 'internal tag list item title')
                .to.equal(internalTag.name);
            expect(tag2.querySelector('.gh-tag-list-slug span').textContent, 'internal tag list item tag')
                .to.equal(internalTag.slug);
            expect(tag2.querySelector('.gh-tag-list-posts-count span').textContent, 'internal tag list item post count')
                .to.equal('0 posts');
        });

        it('it displays the correct post count on the overview page', async function () {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            await authenticateSession();
            await visit('/tags');

            // TODO
        });

        it('it displays an error when tag does not exist', async function () {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            await authenticateSession();
            await visit('/tags/unknown');

            expect(currentRouteName()).to.equal('error'); // TODO: Should be error404?
            expect(currentURL()).to.equal('/tags/unknown');
        });

        it('it loads the tag via slug when accessed directly (tag created with slug and description only)', async function () {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            this.server.create('tag', {
                slug: 'test-tag',
                description: 'Lorum ipsum dolor sit amet'
            });

            await authenticateSession();
            await visit('/tags/test-tag');

            expect(currentURL(), 'URL after direct load').to.equal('/tags/test-tag');

            // Show correct tag information in specific fields
            expect(find('.gh-main-section-content input[name="name"]').value, 'loads correct tag name into form')
                .to.equal('Tag 0');
            expect(find('.gh-main-section-content input[name="slug"]').value, 'loads correct tag slug into form')
                .to.equal('test-tag');
            expect(find('.gh-main-section-content textarea[name="description"]').value, 'loads correct tag description into form')
                .to.equal('Lorum ipsum dolor sit amet');

            // Ensure title and descriptions have correct placeholders when no values are present
            await click('.gh-btn-expand[name="meta"]');
            expect(find('.gh-setting-content-extended input[name="metaTitle"]').getAttribute('placeholder'), 'loads correct placeholder for meta title')
                .to.equal('Tag 0');
            expect(find('.gh-setting-content-extended textarea[name="metaDescription"]').getAttribute('placeholder'), 'loads correct placeholder for meta description')
                .to.equal('Lorum ipsum dolor sit amet');

            await click('.gh-btn-expand[name="twitter"]');
            expect(find('.gh-setting-content-extended input[name="twitterTitle"]').getAttribute('placeholder'), 'loads correct placeholder for twitter title')
                .to.equal('Tag 0');
            expect(find('.gh-setting-content-extended textarea[name="twitterDescription"]').getAttribute('placeholder'), 'loads correct placeholder for twitter description')
                .to.equal('Lorum ipsum dolor sit amet');

            await click('.gh-btn-expand[name="facebook"]');
            expect(find('.gh-setting-content-extended input[name="ogTitle"]').getAttribute('placeholder'), 'loads correct placeholder for facebook title')
                .to.equal('Tag 0');
            expect(find('.gh-setting-content-extended textarea[name="ogDescription"]').getAttribute('placeholder'), 'loads correct placeholder for facebook description')
                .to.equal('Lorum ipsum dolor sit amet');
        });

        it('it loads the tag via slug when accessed directly (tag created with custom properties)', async function () {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});
            this.server.create('tag', {
                name: 'Test tag',
                slug: 'test-tag',
                description: 'Lorum ipsum dolor sit amet',
                metaTitle: 'Lorum ipsum  - Meta title',
                metaDescription: 'Lorum ipsum  - Meta description',
                twitterTitle: 'Lorum ipsum  - TWitter title',
                twitterDescription: 'Lorum ipsum  - Twitter description',
                ogTitle: 'Lorum ipsum  - Facebook title',
                ogDescription: 'Lorum ipsum  - Facebook description',
                codeinjectionHead: 'Lorum ipsum  - Code injection head',
                ogTcodeinjectionFoo: 'Lorum ipsum  - Code injection foot',
                canonicalUrl: 'https://example.com',
                accentColor: '123456'
            });

            await authenticateSession();
            await visit('/tags/test-tag');

            expect(currentURL(), 'URL after direct load').to.equal('/tags/test-tag');

            // Show correct tag information in specific fields
            expect(find('.gh-main-section-content input[name="name"]').value, 'loads correct tag name into form')
                .to.equal('Test tag');
            expect(find('.gh-main-section-content input[name="accent-color"]').value, 'loads correct accent color into form')
                .to.equal('123456');
            expect(find('.gh-main-section-content input[name="slug"]').value, 'loads correct tag slug into form')
                .to.equal('test-tag');
            expect(find('.gh-main-section-content textarea[name="description"]').value, 'loads correct tag description into form')
                .to.equal('Lorum ipsum dolor sit amet');

            // Ensure titles and descriptions have correct values for specific social platforms
            await click('.gh-btn-expand[name="meta"]');
            expect(find('.gh-setting-content-extended input[name="metaTitle"]').value, 'loads correct value for meta title')
                .to.equal('Lorum ipsum  - Meta title');
            expect(find('.gh-setting-content-extended textarea[name="metaDescription"]').value, 'loads correct value for meta description')
                .to.equal('Lorum ipsum  - Meta description');

            await click('.gh-btn-expand[name="twitter"]');
            expect(find('.gh-setting-content-extended input[name="twitterTitle"]').value, 'loads correct value for twitter title')
                .to.equal('Lorum ipsum  - TWitter title');
            expect(find('.gh-setting-content-extended textarea[name="twitterDescription"]').value, 'loads correct value for twitter description')
                .to.equal('Lorum ipsum  - Twitter description');

            await click('.gh-btn-expand[name="facebook"]');
            expect(find('.gh-setting-content-extended input[name="ogTitle"]').value, 'loads correct value for facebook title')
                .to.equal('Lorum ipsum  - Facebook title');
            expect(find('.gh-setting-content-extended textarea[name="ogDescription"]').value, 'loads correct value for facebook description')
                .to.equal('Lorum ipsum  - Facebook description');
        });

        it('it validates correctly when saving a tag without entering any fields', async function () {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            await authenticateSession();
            await visit('/tags/new');

            // Directly click op the save button
            await click('[data-test-button="save"]');

            expect(find('.gh-main-section-content input[name="name"]').nextElementSibling, 'shows error message for name field')
                .to.have.class('error');
        });

        // This test could be heavily approved at least for now tests if the fields contain
        // the correct information after storing and loading the tag.
        it('it can navigate, create tags and edit tags', async function () {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            await authenticateSession();
            await visit('/tags');

            // CREATION OF TAGS

            await click('[data-test-new-tag-button]');
            expect(currentURL(), 'URL after pressing New Tag button').to.equal('/tags/new');

            // all fields start blank
            findAll('.gh-input, .gh-tag-details-textarea, gh-cm-editor-textarea').forEach(function (elem) {
                expect(elem.value, `input field for ${elem.getAttribute('name')}`)
                    .to.be.empty;
            });

            // fill all fields with exact same value;
            findAll('.gh-input, .gh-tag-details-textarea, gh-cm-editor-textarea').forEach(function (elem) {
                elem.value = 'Lorum ipsum';
            });

            // save the tag
            await click('[data-test-button="save"]');
            await visit('/tags/lorum-ipsum');

            // check that all fields have the same value
            findAll('.gh-input, .gh-tag-details-textarea, gh-cm-editor-textarea').forEach(function (elem) {
                expect(elem.value, `input field for ${elem.getAttribute('name')}`)
                    .to.equal('Lorum ipsum');
            });

            // Now fill all the fields with a new value
            findAll('.gh-input, .gh-tag-details-textarea, gh-cm-editor-textarea').forEach(function (elem) {
                elem.value = 'dolor sit amet';
            });

            // save the tag
            await click('[data-test-button="save"]');
            await visit('/tags/lorum-ipsum');

            // check that all fields have the same value
            findAll('.gh-input, .gh-tag-details-textarea, gh-cm-editor-textarea').forEach(function (elem) {
                expect(elem.value, `input field for ${elem.getAttribute('name')}`)
                    .to.equal('dolor sit amet');
            });
        });

        it('it can navigate and delete tags', async function () {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            this.server.create('tag', {slug: 'to-be-deleted-slug'});

            await authenticateSession();
            await visit('tags/to-be-deleted-slug');

            await click('[data-test-delete-button]');
            await click('[data-test-modal-confirm]');

            await visit('/tags/to-be-deleted-slug');

            expect(currentRouteName()).to.equal('error'); // TODO: Should be error404?
            expect(currentURL()).to.equal('/tags/to-be-deleted-slug');
        });

        it('sorts tags correctly based on numeric and ignoring the hashtag', async function () {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            this.server.create('tag', {name: 'B - Fifth', slug: 'fith'});
            this.server.create('tag', {name: '#Z - Last', slug: 'last'});
            this.server.create('tag', {name: 'A - Fourth', slug: 'fourth'});
            this.server.create('tag', {name: '1 - First', slug: 'First'});
            this.server.create('tag', {name: '11 - Third', slug: 'Third'});
            this.server.create('tag', {name: '2 - Second', slug: 'fourth'});

            await authenticateSession();
            await visit('tags');

            let tags = findAll('.gh-tag-list-name');

            expect(tags[0].textContent.trim()).to.equal('1 - First');
            expect(tags[1].textContent.trim()).to.equal('2 - Second');
            expect(tags[2].textContent.trim()).to.equal('11 - Third');
            expect(tags[3].textContent.trim()).to.equal('A - Fourth');
            expect(tags[4].textContent.trim()).to.equal('B - Fifth');
            expect(tags[5].textContent.trim()).to.equal('#Z - Last');
        });
    });
});
