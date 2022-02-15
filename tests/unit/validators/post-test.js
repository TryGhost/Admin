import EmberObject from '@ember/object';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';
import {module, test} from 'qunit';

const Post = EmberObject.extend(ValidationEngine, {
    validationType: 'post',

    email: null
});

module('Unit: Validator: post', function () {
    module('canonicalUrl', function () {
        test('can be blank', async function (assert) {
            let post = Post.create({canonicalUrl: ''});
            let passed = await post.validate({property: 'canonicalUrl'}).then(() => true);

            assert.true(passed, 'passed');
            assert.includes(post.hasValidated, 'canonicalUrl');
        });

        test('can be an absolute URL', async function (assert) {
            let post = Post.create({canonicalUrl: 'http://example.com'});
            let passed = await post.validate({property: 'canonicalUrl'}).then(() => true);

            assert.true(passed, 'passed');
            assert.includes(post.hasValidated, 'canonicalUrl');
        });

        test('can be a relative URL', async function (assert) {
            let post = Post.create({canonicalUrl: '/my-other-post'});
            let passed = await post.validate({property: 'canonicalUrl'}).then(() => true);

            assert.true(passed, 'passed');
            assert.includes(post.hasValidated, 'canonicalUrl');
        });

        test('cannot be a random string', async function (assert) {
            let post = Post.create({canonicalUrl: 'asdfghjk'});
            let passed = await post.validate({property: 'canonicalUrl'}).then(() => true).catch(() => false);

            assert.false(passed, 'passed');
            assert.includes(post.hasValidated, 'canonicalUrl');

            let error = post.errors.errorsFor('canonicalUrl').get(0);
            assert.strictEqual(error.attribute, 'canonicalUrl');
            assert.strictEqual(error.message, 'Please enter a valid URL');
        });

        test('cannot be too long', async function (assert) {
            let post = Post.create({canonicalUrl: `http://example.com/${(new Array(1983).join('x'))}`});
            let passed = await post.validate({property: 'canonicalUrl'}).then(() => true).catch(() => false);

            assert.false(passed, 'passed');
            assert.includes(post.hasValidated, 'canonicalUrl');

            let error = post.errors.errorsFor('canonicalUrl').get(0);
            assert.strictEqual(error.attribute, 'canonicalUrl');
            assert.strictEqual(error.message, 'Canonical URL is too long, max 2000 chars');
        });
    });
});
