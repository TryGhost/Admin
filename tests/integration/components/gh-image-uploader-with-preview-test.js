import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import {click, find, findAll, render} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';

module('Integration: Component: gh-image-uploader-with-preview', function (hooks) {
    setupRenderingTest(hooks);

    test('renders image if provided', async function (assert) {
        let remove = sinon.spy();
        this.set('remove', remove);
        this.set('image', 'http://example.com/test.png');

        await render(hbs`{{gh-image-uploader-with-preview image=image remove=(action remove)}}`);

        assert.strictEqual(findAll('.gh-image-uploader.-with-image').length, 1);
        assert.strictEqual(find('img').getAttribute('src'), 'http://example.com/test.png');
    });

    test('renders upload form when no image provided', async function (assert) {
        await render(hbs`{{gh-image-uploader-with-preview image=image}}`);

        assert.strictEqual(findAll('input[type="file"]').length, 1);
    });

    test('triggers remove action when delete icon is clicked', async function (assert) {
        let remove = sinon.spy();
        this.set('remove', remove);
        this.set('image', 'http://example.com/test.png');

        await render(hbs`{{gh-image-uploader-with-preview image=image remove=(action remove)}}`);
        await click('.image-delete');

        assert.true(remove.calledOnce);
    });
});
