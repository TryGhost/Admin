import EmberObject from '@ember/object';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';
import {module, test} from 'qunit';
// import validator from 'ghost-admin/validators/tag-settings';
import {run} from '@ember/runloop';

const Tag = EmberObject.extend(ValidationEngine, {
    validationType: 'tag',

    name: null,
    description: null,
    metaTitle: null,
    metaDescription: null
});

// TODO: These tests have way too much duplication, consider creating test
// helpers for validations

// TODO: Move testing of validation-engine behaviour into validation-engine-test
// and replace these tests with specific validator tests

module('Unit: Validator: tag-settings', function () {
    test('validates all fields by default', function (assert) {
        let tag = Tag.create({});
        let properties = tag.get('validators.tag.properties');

        // TODO: This is checking implementation details rather than expected
        // behaviour. Replace once we have consistent behaviour (see below)
        assert.includes(properties, 'name', 'properties');
        assert.includes(properties, 'slug', 'properties');
        assert.includes(properties, 'description', 'properties');
        assert.includes(properties, 'metaTitle', 'properties');
        assert.includes(properties, 'metaDescription', 'properties');

        // TODO: .validate (and  by extension .save) doesn't currently affect
        // .hasValidated - it would be good to make this consistent.
        // The following tests currently fail:
        //
        // run(() => {
        //     tag.validate();
        // });
        //
        // expect(tag.get('hasValidated'), 'hasValidated').to.include('name');
        // expect(tag.get('hasValidated'), 'hasValidated').to.include('description');
        // expect(tag.get('hasValidated'), 'hasValidated').to.include('metaTitle');
        // expect(tag.get('hasValidated'), 'hasValidated').to.include('metaDescription');
    });

    test('passes with valid name', function (assert) {
        // longest valid name
        let tag = Tag.create({name: (new Array(192).join('x'))});
        let passed = false;

        assert.strictEqual(tag.get('name').length, 191, 'name length');

        run(() => {
            tag.validate({property: 'name'}).then(() => {
                passed = true;
            });
        });

        assert.true(passed, 'passed');
        assert.includes(tag.get('hasValidated'), 'name', 'hasValidated');
    });

    test('validates name presence', function (assert) {
        let tag = Tag.create();
        let passed = false;
        let nameErrors;

        // TODO: validator is currently a singleton meaning state leaks
        // between all objects that use it. Each object should either
        // get it's own validator instance or validator objects should not
        // contain state. The following currently fails:
        //
        // let validator = tag.get('validators.tag')
        // expect(validator.get('passed'), 'passed').to.be.false;

        run(() => {
            tag.validate({property: 'name'}).then(() => {
                passed = true;
            });
        });

        nameErrors = tag.get('errors').errorsFor('name').get(0);
        assert.strictEqual(nameErrors.attribute, 'name', 'errors.name.attribute');
        assert.strictEqual(nameErrors.message, 'You must specify a name for the tag.', 'errors.name.message');

        assert.false(passed, 'passed');
        assert.includes(tag.get('hasValidated'), 'name', 'hasValidated');
    });

    test('validates names starting with a comma', function (assert) {
        let tag = Tag.create({name: ',test'});
        let passed = false;
        let nameErrors;

        run(() => {
            tag.validate({property: 'name'}).then(() => {
                passed = true;
            });
        });

        nameErrors = tag.get('errors').errorsFor('name').get(0);
        assert.strictEqual(nameErrors.attribute, 'name', 'errors.name.attribute');
        assert.strictEqual(nameErrors.message, 'Tag names can\'t start with commas.', 'errors.name.message');

        assert.false(passed, 'passed');
        assert.includes(tag.get('hasValidated'), 'name', 'hasValidated');
    });

    test('validates name length', function (assert) {
        // shortest invalid name
        let tag = Tag.create({name: (new Array(193).join('x'))});
        let passed = false;
        let nameErrors;

        assert.strictEqual(tag.get('name').length, 192, 'name length');

        run(() => {
            tag.validate({property: 'name'}).then(() => {
                passed = true;
            });
        });

        nameErrors = tag.get('errors').errorsFor('name')[0];
        assert.strictEqual(nameErrors.attribute, 'name', 'errors.name.attribute');
        assert.strictEqual(nameErrors.message, 'Tag names cannot be longer than 191 characters.', 'errors.name.message');

        assert.false(passed, 'passed');
        assert.includes(tag.get('hasValidated'), 'name', 'hasValidated');
    });

    test('passes with valid slug', function (assert) {
        // longest valid slug
        let tag = Tag.create({slug: (new Array(192).join('x'))});
        let passed = false;

        assert.strictEqual(tag.get('slug').length, 191, 'slug length');

        run(() => {
            tag.validate({property: 'slug'}).then(() => {
                passed = true;
            });
        });

        assert.true(passed, 'passed');
        assert.includes(tag.get('hasValidated'), 'slug', 'hasValidated');
    });

    test('validates slug length', function (assert) {
        // shortest invalid slug
        let tag = Tag.create({slug: (new Array(193).join('x'))});
        let passed = false;
        let slugErrors;

        assert.strictEqual(tag.get('slug').length, 192, 'slug length');

        run(() => {
            tag.validate({property: 'slug'}).then(() => {
                passed = true;
            });
        });

        slugErrors = tag.get('errors').errorsFor('slug')[0];
        assert.strictEqual(slugErrors.attribute, 'slug', 'errors.slug.attribute');
        assert.strictEqual(slugErrors.message, 'URL cannot be longer than 191 characters.', 'errors.slug.message');

        assert.false(passed, 'passed');
        assert.includes(tag.get('hasValidated'), 'slug', 'hasValidated');
    });

    test('passes with a valid description', function (assert) {
        // longest valid description
        let tag = Tag.create({description: (new Array(501).join('x'))});
        let passed = false;

        assert.strictEqual(tag.get('description').length, 500, 'description length');

        run(() => {
            tag.validate({property: 'description'}).then(() => {
                passed = true;
            });
        });

        assert.true(passed, 'passed');
        assert.includes(tag.get('hasValidated'), 'description', 'hasValidated');
    });

    test('validates description length', function (assert) {
        // shortest invalid description
        let tag = Tag.create({description: (new Array(502).join('x'))});
        let passed = false;
        let errors;

        assert.strictEqual(tag.get('description').length, 501, 'description length');

        run(() => {
            tag.validate({property: 'description'}).then(() => {
                passed = true;
            });
        });

        errors = tag.get('errors').errorsFor('description')[0];
        assert.strictEqual(errors.attribute, 'description', 'errors.description.attribute');
        assert.strictEqual(errors.message, 'Description cannot be longer than 500 characters.', 'errors.description.message');

        // TODO: tag.errors appears to be a singleton and previous errors are
        // not cleared despite creating a new tag object
        //
        // console.log(JSON.stringify(tag.get('errors')));
        // expect(tag.get('errors.length')).to.equal(1);

        assert.false(passed, 'passed');
        assert.includes(tag.get('hasValidated'), 'description', 'hasValidated');
    });

    // TODO: we have both metaTitle and metaTitle property names on the
    // model/validator respectively - this should be standardised
    test('passes with a valid metaTitle', function (assert) {
        // longest valid metaTitle
        let tag = Tag.create({metaTitle: (new Array(301).join('x'))});
        let passed = false;

        assert.strictEqual(tag.get('metaTitle').length, 300, 'metaTitle length');

        run(() => {
            tag.validate({property: 'metaTitle'}).then(() => {
                passed = true;
            });
        });

        assert.true(passed, 'passed');
        assert.includes(tag.get('hasValidated'), 'metaTitle', 'hasValidated');
    });

    test('validates metaTitle length', function (assert) {
        // shortest invalid metaTitle
        let tag = Tag.create({metaTitle: (new Array(302).join('x'))});
        let passed = false;
        let errors;

        assert.strictEqual(tag.get('metaTitle').length, 301, 'metaTitle length');

        run(() => {
            tag.validate({property: 'metaTitle'}).then(() => {
                passed = true;
            });
        });

        errors = tag.get('errors').errorsFor('metaTitle')[0];
        assert.strictEqual(errors.attribute, 'metaTitle', 'errors.metaTitle.attribute');
        assert.strictEqual(errors.message, 'Meta Title cannot be longer than 300 characters.', 'errors.metaTitle.message');

        assert.false(passed, 'passed');
        assert.includes(tag.get('hasValidated'), 'metaTitle', 'hasValidated');
    });

    // TODO: we have both metaDescription and metaDescription property names on
    // the model/validator respectively - this should be standardised
    test('passes with a valid metaDescription', function (assert) {
        // longest valid description
        let tag = Tag.create({metaDescription: (new Array(501).join('x'))});
        let passed = false;

        assert.strictEqual(tag.get('metaDescription').length, 500, 'metaDescription length');

        run(() => {
            tag.validate({property: 'metaDescription'}).then(() => {
                passed = true;
            });
        });

        assert.true(passed, 'passed');
        assert.includes(tag.get('hasValidated'), 'metaDescription', 'hasValidated');
    });

    test('validates metaDescription length', function (assert) {
        // shortest invalid metaDescription
        let tag = Tag.create({metaDescription: (new Array(502).join('x'))});
        let passed = false;
        let errors;

        assert.strictEqual(tag.get('metaDescription').length, 501, 'metaDescription length');

        run(() => {
            tag.validate({property: 'metaDescription'}).then(() => {
                passed = true;
            });
        });

        errors = tag.get('errors').errorsFor('metaDescription')[0];
        assert.strictEqual(errors.attribute, 'metaDescription', 'errors.metaDescription.attribute');
        assert.strictEqual(errors.message, 'Meta Description cannot be longer than 500 characters.', 'errors.metaDescription.message');

        assert.false(passed, 'passed');
        assert.includes(tag.get('hasValidated'), 'metaDescription', 'hasValidated');
    });
});
