import Service from '@ember/service';
import hbs from 'htmlbars-inline-precompile';
import {click, find} from '@ember/test-helpers';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {setupComponentTest} from 'ember-mocha';

const featureStub = Service.extend({
    testFlag: true
});

describe('Integration: Component: gh-feature-flag', function () {
    setupComponentTest('gh-feature-flag', {
        integration: true
    });

    beforeEach(function () {
        this.register('service:feature', featureStub);
        this.inject.service('feature', {as: 'feature'});
    });

    it('renders properties correctly', function () {
        this.render(hbs`{{gh-feature-flag "testFlag"}}`);
        expect(this.$()).to.have.length(1);
        expect(find('label').getAttribute('for')).to.equal(find('input[type="checkbox"]').id);
    });

    it('renders correctly when flag is set to true', function () {
        this.render(hbs`{{gh-feature-flag "testFlag"}}`);
        expect(this.$()).to.have.length(1);
        expect(find('label input[type="checkbox"]').checked).to.be.true;
    });

    it('renders correctly when flag is set to false', function () {
        this.set('feature.testFlag', false);

        this.render(hbs`{{gh-feature-flag "testFlag"}}`);
        expect(this.$()).to.have.length(1);

        expect(find('label input[type="checkbox"]').checked).to.be.false;
    });

    it('updates to reflect changes in flag property', async function () {
        this.render(hbs`{{gh-feature-flag "testFlag"}}`);
        expect(this.$()).to.have.length(1);

        expect(find('label input[type="checkbox"]').checked).to.be.true;

        await click('label');

        expect(find('label input[type="checkbox"]').checked).to.be.false;
    });
});
