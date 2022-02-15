import NavItem from 'ghost-admin/models/navigation-item';
import validator from 'ghost-admin/validators/nav-item';
import {expect} from 'chai';
import {module, test} from 'qunit';

const testInvalidUrl = function (url) {
    let navItem = NavItem.create({url});

    validator.check(navItem, 'url');

    expect(validator.get('passed'), `"${url}" passed`).to.be.false;
    expect(navItem.get('errors').errorsFor('url').toArray()).to.deep.equal([{
        attribute: 'url',
        message: 'You must specify a valid URL or relative path'
    }]);
    expect(navItem.get('hasValidated')).to.include('url');
};

const testValidUrl = function (url) {
    let navItem = NavItem.create({url});

    validator.check(navItem, 'url');

    expect(validator.get('passed'), `"${url}" failed`).to.be.true;
    expect(navItem.get('hasValidated')).to.include('url');
};

module('Unit: Validator: nav-item', function () {
    test('requires label presence', function (assert) {
        let navItem = NavItem.create();

        validator.check(navItem, 'label');

        assert.false(validator.get('passed'));
        assert.deepEqual(navItem.get('errors').errorsFor('label').toArray(), [{
            attribute: 'label',
            message: 'You must specify a label'
        }]);
        assert.includes(navItem.get('hasValidated'), 'label');
    });

    test('requires url presence', function (assert) {
        let navItem = NavItem.create();

        validator.check(navItem, 'url');

        assert.false(validator.get('passed'));
        assert.deepEqual(navItem.get('errors').errorsFor('url').toArray(), [{
            attribute: 'url',
            message: 'You must specify a URL or relative path'
        }]);
        assert.includes(navItem.get('hasValidated'), 'url');
    });

    test('fails on invalid url values', function () {
        let invalidUrls = [
            'test@example.com',
            '/has spaces',
            'no-leading-slash',
            'http://example.com/with spaces'
        ];

        invalidUrls.forEach(function (url) {
            testInvalidUrl(url);
        });
    });

    test('passes on valid url values', function () {
        let validUrls = [
            'http://localhost:2368',
            'http://localhost:2368/some-path',
            'https://localhost:2368/some-path',
            '//localhost:2368/some-path',
            'http://localhost:2368/#test',
            'http://localhost:2368/?query=test&another=example',
            'http://localhost:2368/?query=test&another=example#test',
            'tel:01234-567890',
            'mailto:test@example.com',
            'http://some:user@example.com:1234',
            '/relative/path'
        ];

        validUrls.forEach(function (url) {
            testValidUrl(url);
        });
    });

    test('validates url and label by default', function (assert) {
        let navItem = NavItem.create();

        validator.check(navItem);

        assert.ok(navItem.get('errors').errorsFor('label'));
        assert.ok(navItem.get('errors').errorsFor('url'));
        assert.false(validator.get('passed'));
    });
});
