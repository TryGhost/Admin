/* jshint expr:true */
import { expect } from 'chai';
import {
  describeComponent,
  it
} from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describeComponent(
  'main-analytics',
  'Integration: MainAnalyticsComponent',
  {
    integration: true
  },
  function() {
    it('renders', function() {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.on('myAction', function(val) { ... });
      // Template block usage:
      // this.render(hbs`
      //   {{#main-analytics}}
      //     template content
      //   {{/main-analytics}}
      // `);

      this.render(hbs`{{main-analytics}}`);
      expect(this.$()).to.have.length(1);
    });
  }
);
