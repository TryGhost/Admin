import {module, test} from 'qunit';
import {run} from '@ember/runloop';
import {setupTest} from 'ember-qunit';

module('Unit: Model: post', function (hooks) {
    setupTest(hooks);

    let store;

    hooks.beforeEach(function () {
        store = this.owner.lookup('service:store');
    });

    test('has a validation type of "post"', function (assert) {
        let model = store.createRecord('post');

        assert.strictEqual(model.validationType, 'post');
    });

    test('isPublished, isDraft and isScheduled are correct', function (assert) {
        let model = store.createRecord('post', {
            status: 'published'
        });

        assert.ok(model.get('isPublished'));
        assert.notOk(model.get('isDraft'));
        assert.notOk(model.get('isScheduled'));

        run(function () {
            model.set('status', 'draft');

            assert.notOk(model.get('isPublished'));
            assert.ok(model.get('isDraft'));
            assert.notOk(model.get('isScheduled'));
        });

        run(function () {
            model.set('status', 'scheduled');

            assert.ok(model.get('isScheduled'));
            assert.notOk(model.get('isPublished'));
            assert.notOk(model.get('isDraft'));
        });
    });

    test('isAuthoredByUser is correct', function (assert) {
        let user1 = store.createRecord('user', {id: 'abcd1234'});
        let user2 = store.createRecord('user', {id: 'wxyz9876'});

        let model = store.createRecord('post', {
            authors: [user1]
        });

        assert.ok(model.isAuthoredByUser(user1));

        run(function () {
            model.set('authors', [user2]);

            assert.notOk(model.isAuthoredByUser(user1));
        });
    });

    test('updateTags removes and deletes old tags', function (assert) {
        let model = store.createRecord('post');

        run(this, function () {
            let modelTags = model.get('tags');
            let tag1 = store.createRecord('tag', {id: '1'});
            let tag2 = store.createRecord('tag', {id: '2'});
            let tag3 = store.createRecord('tag');

            // During testing a record created without an explicit id will get
            // an id of 'fixture-n' instead of null
            tag3.set('id', null);

            modelTags.pushObject(tag1);
            modelTags.pushObject(tag2);
            modelTags.pushObject(tag3);

            assert.strictEqual(model.get('tags.length'), 3);

            model.updateTags();

            assert.strictEqual(model.get('tags.length'), 2);
            assert.strictEqual(model.get('tags.firstObject.id'), '1');
            assert.strictEqual(model.get('tags').objectAt(1).get('id'), '2');
            assert.notOk(tag1.get('isDeleted'));
            assert.notOk(tag2.get('isDeleted'));
            assert.ok(tag3.get('isDeleted'));
        });
    });
});
