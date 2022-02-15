import {module, test} from 'qunit';
import {run} from '@ember/runloop';
import {setupTest} from 'ember-qunit';

module('Unit: Model: user', function (hooks) {
    setupTest(hooks);

    let store;

    hooks.beforeEach(function () {
        store = this.owner.lookup('service:store');
    });

    test('has a validation type of "user"', function (assert) {
        let model = store.createRecord('user');

        assert.strictEqual(model.get('validationType'), 'user');
    });

    test('isActive/isSuspended properties are correct', function (assert) {
        let model = store.createRecord('user', {
            status: 'active'
        });

        assert.ok(model.get('isActive'));
        assert.notOk(model.get('isSuspended'));

        ['warn-1', 'warn-2', 'warn-3', 'warn-4', 'locked'].forEach(function (status) {
            run(() => {
                model.set('status', status);
            });
            assert.ok(model.get('isActive'));
            assert.notOk(model.get('isSuspended'));
        });

        run(() => {
            model.set('status', 'inactive');
        });
        assert.ok(model.get('isSuspended'));
        assert.notOk(model.get('isActive'));
    });

    test('role property is correct', function (assert) {
        let model = store.createRecord('user');

        run(() => {
            let role = store.push({data: {id: 1, type: 'role', attributes: {name: 'Author'}}});
            model.get('roles').pushObject(role);
        });
        assert.strictEqual(model.get('role.name'), 'Author');

        run(() => {
            let role = store.push({data: {id: 1, type: 'role', attributes: {name: 'Editor'}}});
            model.set('role', role);
        });
        assert.strictEqual(model.get('role.name'), 'Editor');
    });

    test('isContributor property is correct', function (assert) {
        let model = store.createRecord('user');

        run(() => {
            let role = store.push({data: {id: 1, type: 'role', attributes: {name: 'Contributor'}}});
            model.set('role', role);
        });
        assert.ok(model.get('isContributor'));
        assert.ok(model.get('isAuthorOrContributor'));
        assert.notOk(model.get('isAuthor'));
        assert.notOk(model.get('isEditor'));
        assert.notOk(model.get('isAdminOnly'));
        assert.notOk(model.get('isOwnerOnly'));
    });

    test('isAuthor property is correct', function (assert) {
        let model = store.createRecord('user');

        run(() => {
            let role = store.push({data: {id: 1, type: 'role', attributes: {name: 'Author'}}});
            model.set('role', role);
        });
        assert.ok(model.get('isAuthor'));
        assert.notOk(model.get('isContributor'));
        assert.ok(model.get('isAuthorOrContributor'));
        assert.notOk(model.get('isEditor'));
        assert.notOk(model.get('isAdminOnly'));
        assert.notOk(model.get('isOwnerOnly'));
    });

    test('isEditor property is correct', function (assert) {
        let model = store.createRecord('user');

        run(() => {
            let role = store.push({data: {id: 1, type: 'role', attributes: {name: 'Editor'}}});
            model.set('role', role);
        });
        assert.ok(model.get('isEditor'));
        assert.notOk(model.get('isAuthor'));
        assert.notOk(model.get('isContributor'));
        assert.notOk(model.get('isAuthorOrContributor'));
        assert.notOk(model.get('isAdminOnly'));
        assert.notOk(model.get('isOwnerOnly'));
    });

    test('isAdminOnly property is correct', function (assert) {
        let model = store.createRecord('user');

        run(() => {
            let role = store.push({data: {id: 1, type: 'role', attributes: {name: 'Administrator'}}});
            model.set('role', role);
        });
        assert.ok(model.get('isAdminOnly'));
        assert.notOk(model.get('isAuthor'));
        assert.notOk(model.get('isContributor'));
        assert.notOk(model.get('isAuthorOrContributor'));
        assert.notOk(model.get('isEditor'));
        assert.notOk(model.get('isOwnerOnly'));
    });

    test('isOwnerOnly property is correct', function (assert) {
        let model = store.createRecord('user');

        run(() => {
            let role = store.push({data: {id: 1, type: 'role', attributes: {name: 'Owner'}}});
            model.set('role', role);
        });
        assert.ok(model.get('isOwnerOnly'));
        assert.notOk(model.get('isAuthor'));
        assert.notOk(model.get('isContributor'));
        assert.notOk(model.get('isAuthorOrContributor'));
        assert.notOk(model.get('isAdminOnly'));
        assert.notOk(model.get('isEditor'));
    });
});
