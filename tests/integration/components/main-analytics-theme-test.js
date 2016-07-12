/* jshint expr:true */
import { expect } from 'chai';
import {
  describeComponent,
  it
} from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describeComponent(
  'main-analytics-theme',
  'Integration: MainAnalyticsThemeComponent',
  {
    integration: true
  },
  function() {
    it('renders', function() {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.on('myAction', function(val) { ... });
      // Template block usage:
      // this.render(hbs`
      //   {{#main-analytics-theme}}
      //     template content
      //   {{/main-analytics-theme}}
      // `);

      this.render(hbs`{{main-analytics-theme}}`);
      expect(this.$()).to.have.length(1);
    });
  }
);
