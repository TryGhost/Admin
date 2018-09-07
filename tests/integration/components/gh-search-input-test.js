import Pretender from 'pretender';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {fillIn, findAll} from '@ember/test-helpers';
import {run} from '@ember/runloop';
import {setupComponentTest} from 'ember-mocha';

describe('Integration: Component: gh-search-input', function () {
    setupComponentTest('gh-search-input', {
        integration: true
    });

    let server;

    beforeEach(function () {
        server = new Pretender();
    });

    afterEach(function () {
        server.shutdown();
    });

    it('renders', function () {
        // renders the component on the page
        this.render(hbs`{{gh-search-input}}`);

        expect(this.$('.ember-power-select-search input')).to.have.length(1);
    });

    it('opens the dropdown on text entry', function (done) {
        this.render(hbs`{{gh-search-input}}`);

        // enter text to trigger search
        run(async () => {
            await fillIn('input[type="search"]', 'test');
        });

        wait().then(() => {
            expect(findAll('.ember-basic-dropdown-content').length).to.equal(1);
            done();
        });
    });
});
