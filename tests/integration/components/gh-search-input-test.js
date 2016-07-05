/* jshint expr:true */
import { expect } from 'chai';
import {
    describeComponent,
    it
} from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import run from 'ember-runloop';
import wait from 'ember-test-helpers/wait';

describeComponent(
    'gh-search-input',
    'Integration: Component: gh-search-input',
    {
        integration: true
    },
    function () {
        it('renders', function () {
            // renders the component on the page
            this.render(hbs`{{gh-search-input}}`);

            expect(this.$('.ember-power-select-search input')).to.have.length(1);
        });

        it('opens the dropdown on text entry', function (done) {
            this.render(hbs`{{gh-search-input}}`);

            // enter text to trigger search
            run(() => {
                this.$('input[type="search"]').val('test').trigger('input');
            });

            wait().then(() => {
                expect(this.$('.ember-basic-dropdown-content').length).to.equal(1);
                done();
            });
        });
    }
);
