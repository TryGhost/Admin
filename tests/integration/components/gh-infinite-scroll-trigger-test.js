import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | gh infinite scroll trigger', function() {
  setupComponentTest('gh-infinite-scroll-trigger', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#gh-infinite-scroll-trigger}}
    //     template content
    //   {{/gh-infinite-scroll-trigger}}
    // `);

    this.render(hbs`{{gh-infinite-scroll-trigger}}`);
    expect(this.$()).to.have.length(1);
  });
});
