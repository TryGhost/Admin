// TODO: remove usage of Ember Data's private `Errors` class when refactoring validations
// eslint-disable-next-line
import DS from 'ember-data';
import EmberObject from '@ember/object';
import hbs from 'htmlbars-inline-precompile';
import {module, test} from 'qunit';
import {render} from '@ember/test-helpers';
import {setupRenderingTest} from 'ember-qunit';

const {Errors} = DS;

module('Integration: Component: gh-validation-status-container', function (hooks) {
    setupRenderingTest(hooks);

    hooks.beforeEach(function () {
        let testObject = EmberObject.create();
        testObject.set('name', 'Test');
        testObject.set('hasValidated', []);
        testObject.set('errors', Errors.create());

        this.set('testObject', testObject);
    });

    test('has no success/error class by default', async function (assert) {
        await render(hbs`
            {{#gh-validation-status-container class="gh-test" property="name" errors=testObject.errors hasValidated=testObject.hasValidated}}
            {{/gh-validation-status-container}}
        `);

        assert.dom('.gh-test').exists();
        assert.dom('.gh-test').doesNotHaveClass('success');
        assert.dom('.gh-test').doesNotHaveClass('error');
    });

    test('has success class when valid', async function (assert) {
        this.get('testObject.hasValidated').push('name');

        await render(hbs`
            {{#gh-validation-status-container class="gh-test" property="name" errors=testObject.errors hasValidated=testObject.hasValidated}}
            {{/gh-validation-status-container}}
        `);

        assert.dom('.gh-test').exists();
        assert.dom('.gh-test').hasClass('success');
        assert.dom('.gh-test').doesNotHaveClass('error');
    });

    test('has error class when invalid', async function (assert) {
        this.get('testObject.hasValidated').push('name');
        this.get('testObject.errors').add('name', 'has error');

        await render(hbs`
            {{#gh-validation-status-container class="gh-test" property="name" errors=testObject.errors hasValidated=testObject.hasValidated}}
            {{/gh-validation-status-container}}
        `);

        assert.dom('.gh-test').exists();
        assert.dom('.gh-test').doesNotHaveClass('success');
        assert.dom('.gh-test').hasClass('error');
    });

    test('still renders if hasValidated is undefined', async function (assert) {
        this.set('testObject.hasValidated', undefined);

        await render(hbs`
            {{#gh-validation-status-container class="gh-test" property="name" errors=testObject.errors hasValidated=testObject.hasValidated}}
            {{/gh-validation-status-container}}
        `);

        assert.dom('.gh-test').exists();
    });
});
