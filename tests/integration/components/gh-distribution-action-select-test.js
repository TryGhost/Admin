import hbs from 'htmlbars-inline-precompile';
import mockPosts from '../../../mirage/config/posts';
import {module, test} from 'qunit';
import {render, settled} from '@ember/test-helpers';
import {setupRenderingTest} from 'ember-qunit';
import {startMirage} from 'ghost-admin/initializers/ember-cli-mirage';

module('Integration: Component: gh-distribution-action-select', function (hooks) {
    setupRenderingTest(hooks);
    let server;

    hooks.beforeEach(function () {
        server = startMirage();
        let author = server.create('user');

        mockPosts(server);

        server.create('post', {authors: [author]});

        this.set('store', this.owner.lookup('service:store'));
    });

    hooks.afterEach(function () {
        server.shutdown();
    });

    test('renders', async function (assert) {
        this.set('post', this.store.findRecord('post', 1));
        await settled();

        await render(hbs`<GhDistributionActionSelect @post=post />`);

        assert.ok(this.element, 'top-level elements');
    });
});
