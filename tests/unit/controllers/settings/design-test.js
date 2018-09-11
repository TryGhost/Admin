import EmberObject from '@ember/object';
import NavItem from 'ghost-admin/models/navigation-item';
import localeConfig from 'ember-i18n/config/en';
import {assert, expect} from 'chai';
import {describe, it} from 'mocha';
import {getOwner} from '@ember/application';
import {run} from '@ember/runloop';
import {setupTest} from 'ember-mocha';

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

describe('Unit: Controller: settings/design', function () {
    setupTest('controller:settings/design', {
        // Specify the other units that are required for this test.
        needs: [
            'model:navigation-item',
            'service:ajax',
            'service:config',
            'service:ghostPaths',
            'service:notifications',
            'service:session',
            'service:upgrade-status',
            'service:settings',
            'service:i18n',
            'locale:en/translations',
            'locale:en/config',
            'util:i18n/missing-message',
            'util:i18n/compile-template',
            'config:environment',
            'helper:t'
        ]
    });

    beforeEach(function () {
        getOwner(this).lookup('service:i18n').set('locale', 'en');
        this.register('locale:en/config', localeConfig);
    });

    it('blogUrl: captures config and ensures trailing slash', function () {
        let ctrl = this.subject();
        ctrl.set('config.blogUrl', 'http://localhost:2368/blog');
        expect(ctrl.get('blogUrl')).to.equal('http://localhost:2368/blog/');
    });

    it('init: creates a new navigation item', function () {
        let ctrl = this.subject();

        run(() => {
            expect(ctrl.get('newNavItem')).to.exist;
            expect(ctrl.get('newNavItem.isNew')).to.be.true;
        });
    });

    it('blogUrl: captures config and ensures trailing slash', function () {
        let ctrl = this.subject();
        ctrl.set('config.blogUrl', 'http://localhost:2368/blog');
        expect(ctrl.get('blogUrl')).to.equal('http://localhost:2368/blog/');
    });

    it('save: validates nav items', function (done) {
        let ctrl = this.subject();

        run(() => {
            ctrl.set('settings', EmberObject.create({navigation: [
                NavItem.create({label: 'First', url: '/'}),
                NavItem.create({label: '', url: '/second'}),
                NavItem.create({label: 'Third', url: ''})
            ].map((item) => {
                item.validators.navItem.set('i18n', getOwner(this).lookup('service:i18n'));
                return item;
            })}));
            // blank item won't get added because the last item is incomplete
            expect(ctrl.get('settings.navigation.length')).to.equal(3);

            ctrl.get('save').perform().then(function passedValidation() {
                assert(false, 'navigationItems weren\'t validated on save');
                done();
            }).catch(function failedValidation() {
                let navItems = ctrl.get('settings.navigation');
                expect(navItems[0].get('errors').toArray()).to.be.empty;
                expect(navItems[1].get('errors.firstObject.attribute')).to.equal('label');
                expect(navItems[2].get('errors.firstObject.attribute')).to.equal('url');
                done();
            });
        });
    });

    it('save: ignores blank last item when saving', function (done) {
        let ctrl = this.subject();

        run(() => {
            ctrl.set('settings', EmberObject.create({navigation: [
                NavItem.create({label: 'First', url: '/'}),
                NavItem.create({label: '', url: ''})
            ].map((item) => {
                item.validators.navItem.set('i18n', getOwner(this).lookup('service:i18n'));
                return item;
            })}));

            expect(ctrl.get('settings.navigation.length')).to.equal(2);

            ctrl.get('save').perform().then(function passedValidation() {
                assert(false, 'navigationItems weren\'t validated on save');
                done();
            }).catch(function failedValidation() {
                let navItems = ctrl.get('settings.navigation');
                expect(navItems[0].get('errors').toArray()).to.be.empty;
                done();
            });
        });
    });

    it('action - addNavItem: adds item to navigationItems', function () {
        let ctrl = this.subject();

        run(() => {
            ctrl.set('settings', EmberObject.create({navigation: [
                NavItem.create({label: 'First', url: '/first', last: true})
            ]}));
        });

        expect(ctrl.get('settings.navigation.length')).to.equal(1);

        ctrl.set('newNavItem.label', 'New');
        ctrl.set('newNavItem.url', '/new');

        run(() => {
            ctrl.send('addNavItem');
        });

        expect(ctrl.get('settings.navigation.length')).to.equal(2);
        expect(ctrl.get('settings.navigation.lastObject.label')).to.equal('New');
        expect(ctrl.get('settings.navigation.lastObject.url')).to.equal('/new');
        expect(ctrl.get('settings.navigation.lastObject.isNew')).to.be.false;
        expect(ctrl.get('newNavItem.label')).to.be.empty;
        expect(ctrl.get('newNavItem.url')).to.be.empty;
        expect(ctrl.get('newNavItem.isNew')).to.be.true;
    });

    it('action - addNavItem: doesn\'t insert new item if last object is incomplete', function () {
        let ctrl = this.subject();

        run(() => {
            ctrl.set('settings', EmberObject.create({navigation: [
                NavItem.create({label: '', url: '', last: true})
            ]}));
            expect(ctrl.get('settings.navigation.length')).to.equal(1);
            ctrl.send('addNavItem');
            expect(ctrl.get('settings.navigation.length')).to.equal(1);
        });
    });

    it('action - deleteNavItem: removes item from navigationItems', function () {
        let ctrl = this.subject();
        let navItems = [
            NavItem.create({label: 'First', url: '/first'}),
            NavItem.create({label: 'Second', url: '/second', last: true})
        ];

        run(() => {
            ctrl.set('settings', EmberObject.create({navigation: navItems}));
            expect(ctrl.get('settings.navigation').mapBy('label')).to.deep.equal(['First', 'Second']);
            ctrl.send('deleteNavItem', ctrl.get('settings.navigation.firstObject'));
            expect(ctrl.get('settings.navigation').mapBy('label')).to.deep.equal(['Second']);
        });
    });

    it('action - updateUrl: updates URL on navigationItem', function () {
        let ctrl = this.subject();
        let navItems = [
            NavItem.create({label: 'First', url: '/first'}),
            NavItem.create({label: 'Second', url: '/second', last: true})
        ];

        run(() => {
            ctrl.set('settings', EmberObject.create({navigation: navItems}));
            expect(ctrl.get('settings.navigation').mapBy('url')).to.deep.equal(['/first', '/second']);
            ctrl.send('updateUrl', '/new', ctrl.get('settings.navigation.firstObject'));
            expect(ctrl.get('settings.navigation').mapBy('url')).to.deep.equal(['/new', '/second']);
        });
    });
});
