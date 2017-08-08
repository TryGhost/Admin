import hbs from 'htmlbars-inline-precompile';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {setupComponentTest} from 'ember-mocha';

describe('Integration: Component: gh-scroll-trigger', function() {
    setupComponentTest('gh-scroll-trigger', {
        integration: true
    });

    it('renders', function() {
        // Set any properties with this.set('myProperty', 'value');
        // Handle any actions with this.on('myAction', function(val) { ... });
        // Template block usage:
        // this.render(hbs`
        //   {{#gh-scroll-trigger}}
        //     template content
        //   {{/gh-scroll-trigger}}
        // `);

        this.render(hbs`{{gh-scroll-trigger}}`);
        expect(this.$()).to.have.length(1);
    });
});
