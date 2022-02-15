// import { expect } from 'chai';
import {module, test} from 'qunit';
// import EmberObject from 'ember-object';
// import ValidationEngineMixin from 'ghost-admin/mixins/validation-engine';

module('ValidationEngineMixin', function () {
    module('#validate', function () {
        test('loads the correct validator');
        test('rejects if the validator doesn\'t exist');
        test('resolves with valid object');
        test('rejects with invalid object');
        test('clears all existing errors');

        module('with a specified property', function () {
            test('resolves with valid property');
            test('rejects with invalid property');
            test('adds property to hasValidated array');
            test('clears existing error on specified property');
        });

        test('handles a passed in model');
        test('uses this.model if available');
    });

    module('#save', function () {
        test('calls validate');
        test('rejects with validation errors');
        test('calls object\'s #save if validation passes');
        test('skips validation if it\'s a deletion');
    });
});
