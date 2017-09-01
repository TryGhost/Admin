import hbs from 'htmlbars-inline-precompile';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {setupComponentTest} from 'ember-mocha';

describe('Integration: Component: gh-mailchimp-settings', function() {
    setupComponentTest('gh-mailchimp-settings', {
        integration: true
    });

    it('renders', function() {
        // Set any properties with this.set('myProperty', 'value');
        // Handle any actions with this.on('myAction', function(val) { ... });
        // Template block usage:
        // this.render(hbs`
        //   {{#gh-mailchimp-settings}}
        //     template content
        //   {{/gh-mailchimp-settings}}
        // `);

        this.render(hbs`{{gh-mailchimp-settings}}`);
        expect(this.$()).to.have.length(1);
    });
});
