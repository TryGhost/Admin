import EmberObject from '@ember/object';
import NavItem from 'ghost-admin/models/navigation-item';
import {assert} from 'chai';
import {module, skip} from 'qunit';
import {run} from '@ember/runloop';
import {setupTest} from 'ember-qunit';

// const navSettingJSON = `[
//     {"label":"Home","url":"/"},
//     {"label":"JS Test","url":"javascript:alert('hello');"},
//     {"label":"About","url":"/about"},
//     {"label":"Sub Folder","url":"/blah/blah"},
//     {"label":"Telephone","url":"tel:01234-567890"},
//     {"label":"Mailto","url":"mailto:test@example.com"},
//     {"label":"External","url":"https://example.com/testing?query=test#anchor"},
//     {"label":"No Protocol","url":"//example.com"}
// ]`;

module('Unit: Controller: settings/design', function (hooks) {
    setupTest(hooks);

    skip('blogUrl: captures config and ensures trailing slash', function (assert) {
        let ctrl = this.owner.lookup('controller:settings/design');
        ctrl.set('config.blogUrl', 'http://localhost:2368/blog');
        assert.strictEqual(ctrl.get('blogUrl'), 'http://localhost:2368/blog/');
    });

    skip('init: creates a new navigation item', function (assert) {
        let ctrl = this.owner.lookup('controller:settings/design');

        run(() => {
            assert.ok(ctrl.get('newNavItem'));
            assert.strictEqual(ctrl.get('newNavItem.isNew'), true);
        });
    });

    skip('blogUrl: captures config and ensures trailing slash', function (assert) {
        let ctrl = this.owner.lookup('controller:settings/design');
        ctrl.set('config.blogUrl', 'http://localhost:2368/blog');
        assert.strictEqual(ctrl.get('blogUrl'), 'http://localhost:2368/blog/');
    });

    skip('save: validates nav items', function (assert) {
        let ctrl = this.owner.lookup('controller:settings/design');

        run(() => {
            ctrl.set('settings', EmberObject.create({navigation: [
                NavItem.create({label: 'First', url: '/'}),
                NavItem.create({label: '', url: '/second'}),
                NavItem.create({label: 'Third', url: ''})
            ]}));
            // blank item won't get added because the last item is incomplete
            assert.strictEqual(ctrl.get('settings.navigation.length'), 3);

            ctrl.get('save').perform().then(function passedValidation() {
                assert(false, 'navigationItems weren\'t validated on save');
            }).catch(function failedValidation() {
                let navItems = ctrl.get('settings.navigation');
                assert.notOk(navItems[0].get('errors').toArray());
                assert.strictEqual(navItems[1].get('errors.firstObject.attribute'), 'label');
                assert.strictEqual(navItems[2].get('errors.firstObject.attribute'), 'url');
            });
        });
    });

    skip('save: ignores blank last item when saving', function (assert) {
        let ctrl = this.owner.lookup('controller:settings/design');

        run(() => {
            ctrl.set('settings', EmberObject.create({navigation: [
                NavItem.create({label: 'First', url: '/'}),
                NavItem.create({label: '', url: ''})
            ]}));

            assert.strictEqual(ctrl.get('settings.navigation.length'), 2);

            ctrl.get('save').perform().then(function passedValidation() {
                assert(false, 'navigationItems weren\'t validated on save');
            }).catch(function failedValidation() {
                let navItems = ctrl.get('settings.navigation');
                assert.notOk(navItems[0].get('errors').toArray());
            });
        });
    });

    skip('action - addNavItem: adds item to navigationItems', function (assert) {
        let ctrl = this.owner.lookup('controller:settings/design');

        run(() => {
            ctrl.set('settings', EmberObject.create({navigation: [
                NavItem.create({label: 'First', url: '/first', last: true})
            ]}));
        });

        assert.strictEqual(ctrl.get('settings.navigation.length'), 1);

        ctrl.set('newNavItem.label', 'New');
        ctrl.set('newNavItem.url', '/new');

        run(() => {
            ctrl.send('addNavItem', ctrl.get('newNavItem'));
        });

        assert.strictEqual(ctrl.get('settings.navigation.length'), 2);
        assert.strictEqual(ctrl.get('settings.navigation.lastObject.label'), 'New');
        assert.strictEqual(ctrl.get('settings.navigation.lastObject.url'), '/new');
        assert.strictEqual(ctrl.get('settings.navigation.lastObject.isNew'), false);
        assert.notOk(ctrl.get('newNavItem.label'));
        assert.notOk(ctrl.get('newNavItem.url'));
        assert.strictEqual(ctrl.get('newNavItem.isNew'), true);
    });

    skip('action - addNavItem: doesn\'t insert new item if last object is incomplete', function (assert) {
        let ctrl = this.owner.lookup('controller:settings/design');

        run(() => {
            ctrl.set('settings', EmberObject.create({navigation: [
                NavItem.create({label: '', url: '', last: true})
            ]}));
            assert.strictEqual(ctrl.get('settings.navigation.length'), 1);
            ctrl.send('addNavItem', ctrl.get('settings.navigation.lastObject'));
            assert.strictEqual(ctrl.get('settings.navigation.length'), 1);
        });
    });

    skip('action - deleteNavItem: removes item from navigationItems', function (assert) {
        let ctrl = this.owner.lookup('controller:settings/design');
        let navItems = [
            NavItem.create({label: 'First', url: '/first'}),
            NavItem.create({label: 'Second', url: '/second', last: true})
        ];

        run(() => {
            ctrl.set('settings', EmberObject.create({navigation: navItems}));
            assert.deepEqual(ctrl.get('settings.navigation').mapBy('label'), ['First', 'Second']);
            ctrl.send('deleteNavItem', ctrl.get('settings.navigation.firstObject'));
            assert.deepEqual(ctrl.get('settings.navigation').mapBy('label'), ['Second']);
        });
    });

    skip('action - updateUrl: updates URL on navigationItem', function (assert) {
        let ctrl = this.owner.lookup('controller:settings/design');
        let navItems = [
            NavItem.create({label: 'First', url: '/first'}),
            NavItem.create({label: 'Second', url: '/second', last: true})
        ];

        run(() => {
            ctrl.set('settings', EmberObject.create({navigation: navItems}));
            assert.deepEqual(ctrl.get('settings.navigation').mapBy('url'), ['/first', '/second']);
            ctrl.send('updateUrl', '/new', ctrl.get('settings.navigation.firstObject'));
            assert.deepEqual(ctrl.get('settings.navigation').mapBy('url'), ['/new', '/second']);
        });
    });
});
