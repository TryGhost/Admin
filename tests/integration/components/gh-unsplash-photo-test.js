import hbs from 'htmlbars-inline-precompile';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {setupComponentTest} from 'ember-mocha';

describe('Integration: Component: gh unsplash photo', function() {
    setupComponentTest('gh-unsplash-photo', {
        integration: true
    });

    it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#gh-unsplash-photo}}
    //     template content
    //   {{/gh-unsplash-photo}}
    // `);

        this.render(hbs`{{gh-unsplash-photo}}`);
        expect(this.$()).to.have.length(1);
    });
});
