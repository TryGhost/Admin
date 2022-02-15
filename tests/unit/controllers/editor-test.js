import EmberObject from '@ember/object';
import RSVP from 'rsvp';
import {defineProperty} from '@ember/object';
import {module, test} from 'qunit';
import {settled} from '@ember/test-helpers';
import {setupTest} from 'ember-qunit';
import {task} from 'ember-concurrency';

module('Unit: Controller: editor', function (hooks) {
    setupTest(hooks);

    module('generateSlug', function () {
        test('should generate a slug and set it on the post', async function (assert) {
            let controller = this.owner.lookup('controller:editor');

            controller.set('slugGenerator', EmberObject.create({
                generateSlug(slugType, str) {
                    return RSVP.resolve(`${str}-slug`);
                }
            }));
            controller.set('post', EmberObject.create({slug: ''}));

            controller.set('post.titleScratch', 'title');
            await settled();

            assert.strictEqual(controller.get('post.slug'), '');

            await controller.generateSlugTask.perform();

            assert.strictEqual(controller.get('post.slug'), 'title-slug');
        });

        test('should not set the destination if the title is "(Untitled)" and the post already has a slug', async function (assert) {
            let controller = this.owner.lookup('controller:editor');

            controller.set('slugGenerator', EmberObject.create({
                generateSlug(slugType, str) {
                    return RSVP.resolve(`${str}-slug`);
                }
            }));
            controller.set('post', EmberObject.create({slug: 'whatever'}));

            assert.strictEqual(controller.get('post.slug'), 'whatever');

            controller.set('post.titleScratch', '(Untitled)');
            await controller.generateSlugTask.perform();

            assert.strictEqual(controller.get('post.slug'), 'whatever');
        });
    });

    module('saveTitleTask', function (hooks) {
        hooks.beforeEach(function () {
            this.controller = this.owner.lookup('controller:editor');
            this.controller.set('target', {send() {}});
        });

        test('should invoke generateSlug if the post is new and a title has not been set', async function (assert) {
            let {controller} = this;

            controller.set('target', {send() {}});
            defineProperty(controller, 'generateSlugTask', task(function * () {
                this.set('post.slug', 'test-slug');
                yield RSVP.resolve();
            }));
            controller.set('post', EmberObject.create({isNew: true}));

            assert.true(controller.get('post.isNew'));
            assert.notOk(controller.get('post.titleScratch'));

            controller.set('post.titleScratch', 'test');
            await controller.saveTitleTask.perform();

            assert.strictEqual(controller.get('post.titleScratch'), 'test');
            assert.strictEqual(controller.get('post.slug'), 'test-slug');
        });

        test('should invoke generateSlug if the post is not new and it\'s title is "(Untitled)"', async function (assert) {
            let {controller} = this;

            controller.set('target', {send() {}});
            defineProperty(controller, 'generateSlugTask', task(function * () {
                this.set('post.slug', 'test-slug');
                yield RSVP.resolve();
            }));
            controller.set('post', EmberObject.create({isNew: false, title: '(Untitled)'}));

            assert.false(controller.get('post.isNew'));
            assert.notOk(controller.get('post.titleScratch'));

            controller.set('post.titleScratch', 'New Title');

            await controller.saveTitleTask.perform();

            assert.strictEqual(controller.get('post.titleScratch'), 'New Title');
            assert.strictEqual(controller.get('post.slug'), 'test-slug');
        });

        test('should not invoke generateSlug if the post is new but has a title', async function (assert) {
            let {controller} = this;

            controller.set('target', {send() {}});
            defineProperty(controller, 'generateSlugTask', task(function * () {
                assert.false(true, 'generateSlug should not be called');
                yield RSVP.resolve();
            }));
            controller.set('post', EmberObject.create({
                isNew: true,
                title: 'a title'
            }));

            assert.true(controller.get('post.isNew'));
            assert.strictEqual(controller.get('post.title'), 'a title');
            assert.notOk(controller.get('post.titleScratch'));

            controller.set('post.titleScratch', 'test');
            await controller.saveTitleTask.perform();

            assert.strictEqual(controller.get('post.titleScratch'), 'test');
            assert.notOk(controller.get('post.slug'));
        });

        test('should not invoke generateSlug if the post is not new and the title is not "(Untitled)"', async function (assert) {
            let {controller} = this;

            controller.set('target', {send() {}});
            defineProperty(controller, 'generateSlugTask', task(function * () {
                assert.false(true, 'generateSlug should not be called');
                yield RSVP.resolve();
            }));
            controller.set('post', EmberObject.create({isNew: false}));

            assert.false(controller.get('post.isNew'));
            assert.notOk(controller.get('post.title'));

            controller.set('post.titleScratch', 'title');
            await controller.saveTitleTask.perform();

            assert.strictEqual(controller.get('post.titleScratch'), 'title');
            assert.notOk(controller.get('post.slug'));
        });
    });
});
