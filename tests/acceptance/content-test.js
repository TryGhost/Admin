import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {click, currentURL, fillIn, find, findAll, settled, visit} from '@ember/test-helpers';
import {clickTrigger, selectChoose} from 'ember-power-select/test-support/helpers';
import {module, skip, test} from 'qunit';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';

module('Acceptance: Content', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    test('redirects to signin when not authenticated', async function (assert) {
        await invalidateSession();
        await visit('/posts');

        assert.strictEqual(currentURL(), '/signin');
    });

    module('as admin', function (hooks) {
        let admin, editor, publishedPost, scheduledPost, draftPost, authorPost;

        hooks.beforeEach(async function () {
            let adminRole = this.server.create('role', {name: 'Administrator'});
            admin = this.server.create('user', {roles: [adminRole]});
            let editorRole = this.server.create('role', {name: 'Editor'});
            editor = this.server.create('user', {roles: [editorRole]});

            publishedPost = this.server.create('post', {authors: [admin], status: 'published', title: 'Published Post'});
            scheduledPost = this.server.create('post', {authors: [admin], status: 'scheduled', title: 'Scheduled Post'});
            draftPost = this.server.create('post', {authors: [admin], status: 'draft', title: 'Draft Post'});
            authorPost = this.server.create('post', {authors: [editor], status: 'published', title: 'Editor Published Post'});

            // pages shouldn't appear in the list
            this.server.create('page', {authors: [admin], status: 'published', title: 'Published Page'});

            return await authenticateSession();
        });

        skip('displays and filters posts', async function (assert) {
            await visit('/posts');
            // Not checking request here as it won't be the last request made
            // Displays all posts + pages
            assert.strictEqual(findAll('[data-test-post-id]').length, 4, 'all posts count');

            // show draft posts
            await selectChoose('[data-test-type-select]', 'Draft posts');

            // API request is correct
            let [lastRequest] = this.server.pretender.handledRequests.slice(-1);
            assert.includes(lastRequest.queryParams.filter, 'status:draft', '"drafts" request status filter');
            // Displays draft post
            assert.strictEqual(findAll('[data-test-post-id]').length, 1, 'drafts count');
            assert.dom(`[data-test-post-id="${draftPost.id}"]`).exists('draft post');

            // show published posts
            await selectChoose('[data-test-type-select]', 'Published posts');

            // API request is correct
            [lastRequest] = this.server.pretender.handledRequests.slice(-1);
            assert.includes(lastRequest.queryParams.filter, 'status:published', '"published" request status filter');
            // Displays three published posts + pages
            assert.strictEqual(findAll('[data-test-post-id]').length, 2, 'published count');
            assert.dom(`[data-test-post-id="${publishedPost.id}"]`).exists('admin published post');
            assert.dom(`[data-test-post-id="${authorPost.id}"]`).exists('author published post');

            // show scheduled posts
            await selectChoose('[data-test-type-select]', 'Scheduled posts');

            // API request is correct
            [lastRequest] = this.server.pretender.handledRequests.slice(-1);
            assert.includes(lastRequest.queryParams.filter, 'status:scheduled', '"scheduled" request status filter');
            // Displays scheduled post
            assert.strictEqual(findAll('[data-test-post-id]').length, 1, 'scheduled count');
            assert.dom(`[data-test-post-id="${scheduledPost.id}"]`).exists('scheduled post');

            // show all posts
            await selectChoose('[data-test-type-select]', 'All posts');

            // API request is correct
            [lastRequest] = this.server.pretender.handledRequests.slice(-1);
            assert.includes(lastRequest.queryParams.filter, 'status:[draft,scheduled,published]', '"all" request status filter');

            // show all posts by editor
            await selectChoose('[data-test-author-select]', editor.name);

            // API request is correct
            [lastRequest] = this.server.pretender.handledRequests.slice(-1);
            assert.includes(lastRequest.queryParams.filter, 'status:[draft,scheduled,published]', '"editor" request status filter');
            assert.includes(lastRequest.queryParams.filter, `authors:${editor.slug}`, '"editor" request filter param');

            // Post status is only visible when members is enabled
            assert.dom('[data-test-visibility-select]').doesNotExist('access dropdown before members enabled');
            let featureService = this.owner.lookup('service:feature');
            featureService.set('members', true);
            await settled();
            assert.dom('[data-test-visibility-select]').exists('access dropdown after members enabled');

            await selectChoose('[data-test-visibility-select]', 'Paid members-only');
            [lastRequest] = this.server.pretender.handledRequests.slice(-1);
            assert.includes(lastRequest.queryParams.filter, 'visibility:paid+status:[draft,scheduled,published]', '"visibility" request filter param');

            // Displays editor post
            // TODO: implement "filter" param support and fix mirage post->author association
            // expect(find('[data-test-post-id]').length, 'editor post count').to.equal(1);
            // expect(find(`[data-test-post-id="${authorPost.id}"]`), 'author post').to.exist;

            // TODO: test tags dropdown
        });

        // TODO: skipped due to consistently random failures on Travis
        // options[0] is undefined
        // https://github.com/TryGhost/Ghost/issues/10308
        skip('sorts tags filter alphabetically', async function (assert) {
            this.server.create('tag', {name: 'B - Second', slug: 'second'});
            this.server.create('tag', {name: 'Z - Last', slug: 'last'});
            this.server.create('tag', {name: 'A - First', slug: 'first'});

            await visit('/posts');
            await clickTrigger('[data-test-tag-select]');

            let options = findAll('.ember-power-select-option');

            assert.strictEqual(options[0].textContent.trim(), 'All tags');
            assert.strictEqual(options[1].textContent.trim(), 'A - First');
            assert.strictEqual(options[2].textContent.trim(), 'B - Second');
            assert.strictEqual(options[3].textContent.trim(), 'Z - Last');
        });

        test('can add and edit custom views', async function (assert) {
            // actions are not visible when there's no filter
            await visit('/posts');
            assert.dom('[data-test-button="edit-view"]').doesNotExist();
            assert.dom('[data-test-button="add-view"]').doesNotExist();

            // add action is visible after filtering to a non-default filter
            await selectChoose('[data-test-author-select]', admin.name);
            assert.dom('[data-test-button="add-view"]').exists();

            // adding view shows it in the sidebar
            await click('[data-test-button="add-view"]');
            assert.dom('[data-test-modal="custom-view-form"]').exists();
            assert.strictEqual(find('[data-test-modal="custom-view-form"] h1').textContent.trim(), 'New view');
            await fillIn('[data-test-input="custom-view-name"]', 'Test view');
            await click('[data-test-button="save-custom-view"]');
            // modal closes on save
            assert.dom('[data-test-modal="custom-view-form"]').doesNotExist();
            // UI updates
            assert.dom('[data-test-nav-custom="posts-Test view"]').exists();
            assert.strictEqual(find('[data-test-nav-custom="posts-Test view"]').textContent.trim(), 'Test view');
            assert.dom('[data-test-button="add-view"]').doesNotExist();
            assert.dom('[data-test-button="edit-view"]').exists();

            // editing view
            await click('[data-test-button="edit-view"]');
            assert.dom('[data-test-modal="custom-view-form"]').exists();
            assert.strictEqual(find('[data-test-modal="custom-view-form"] h1').textContent.trim(), 'Edit view');
            await fillIn('[data-test-input="custom-view-name"]', 'Updated view');
            await click('[data-test-button="save-custom-view"]');
            // modal closes on save
            assert.dom('[data-test-modal="custom-view-form"]').doesNotExist();
            // UI updates
            assert.dom('[data-test-nav-custom="posts-Updated view"]').exists();
            assert.strictEqual(find('[data-test-nav-custom="posts-Updated view"]').textContent.trim(), 'Updated view');
            assert.dom('[data-test-button="add-view"]').doesNotExist();
            assert.dom('[data-test-button="edit-view"]').exists();
        });

        test('can navigate to custom views', async function (assert) {
            this.server.create('setting', {
                group: 'site',
                key: 'shared_views',
                value: JSON.stringify([{
                    route: 'posts',
                    name: 'My posts',
                    filter: {
                        author: admin.slug
                    }
                }])
            });

            await visit('/posts');

            // nav bar contains default + custom views
            assert.dom('[data-test-nav-custom="posts-Drafts"]').exists();
            assert.dom('[data-test-nav-custom="posts-Scheduled"]').exists();
            assert.dom('[data-test-nav-custom="posts-Published"]').exists();
            assert.dom('[data-test-nav-custom="posts-My posts"]').exists();

            // screen has default title and sidebar is showing inactive custom view
            assert.strictEqual(find('[data-test-screen-title]').textContent.trim(), 'Posts');
            assert.dom('[data-test-nav="posts"]').hasClass('active');

            // clicking sidebar custom view link works
            await click('[data-test-nav-custom="posts-Scheduled"]');
            assert.strictEqual(currentURL(), '/posts?type=scheduled');
            assert.match(find('[data-test-screen-title]').textContent.trim(), /Posts[ \n]+Scheduled/);
            assert.dom('[data-test-nav-custom="posts-Scheduled"]').hasClass('active');

            // clicking the main posts link resets
            await click('[data-test-nav="posts"]');
            assert.strictEqual(currentURL(), '/posts');
            assert.strictEqual(find('[data-test-screen-title]').textContent.trim(), 'Posts');
            assert.dom('[data-test-nav-custom="posts-Scheduled"]').doesNotHaveClass('active');

            // changing a filter to match a custom view shows custom view
            await selectChoose('[data-test-type-select]', 'Scheduled posts');
            assert.strictEqual(currentURL(), '/posts?type=scheduled');
            assert.dom('[data-test-nav-custom="posts-Scheduled"]').hasClass('active');
            assert.match(find('[data-test-screen-title]').textContent.trim(), /Posts[ \n]+Scheduled/);
        });
    });

    module('as author', function (hooks) {
        let author, authorPost;

        hooks.beforeEach(async function () {
            let authorRole = this.server.create('role', {name: 'Author'});
            author = this.server.create('user', {roles: [authorRole]});
            let adminRole = this.server.create('role', {name: 'Administrator'});
            let admin = this.server.create('user', {roles: [adminRole]});

            // create posts
            authorPost = this.server.create('post', {authors: [author], status: 'published', title: 'Author Post'});
            this.server.create('post', {authors: [admin], status: 'scheduled', title: 'Admin Post'});

            return await authenticateSession();
        });

        test('only fetches the author\'s posts', async function (assert) {
            await visit('/posts');
            // trigger a filter request so we can grab the posts API request easily
            await selectChoose('[data-test-type-select]', 'Published posts');

            // API request includes author filter
            let [lastRequest] = this.server.pretender.handledRequests.slice(-1);
            assert.includes(lastRequest.queryParams.filter, `authors:${author.slug}`);

            // only author's post is shown
            assert.strictEqual(findAll('[data-test-post-id]').length, 1, 'post count');
            assert.dom(`[data-test-post-id="${authorPost.id}"]`).exists('author post');
        });
    });

    module('as contributor', function (hooks) {
        hooks.beforeEach(async function () {
            let adminRole = this.server.create('role', {name: 'Administrator'});
            let admin = this.server.create('user', {roles: [adminRole]});

            // Create posts
            this.server.create('post', {authors: [admin], status: 'scheduled', title: 'Admin Post'});

            return await authenticateSession();
        });
    });
});
