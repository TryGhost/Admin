/* jshint expr:true */
import {expect} from 'chai';
import {describe, it} from 'mocha';
import {setupComponentTest} from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe.only('Integration: Component: gh-editor-title', function () {
    setupComponentTest('gh-editor-title', {
        integration: true
    });

    describe('Content test.', function() {
        it('Renders', function (done) {
            this.set('editor', {});
            this.render(hbs`{{gh-editor-title koenigEditor=editor val=""}}`);
            expect(this.$('h2 > div').length).to.equal(1);
            expect(this.$('h2 > div').attr('contenteditable')).to.equal('true');
            done();
        });
        // it('An empty title has a no-content className.', function (done) {
        //     this.render(hbs`{{gh-editor-title}}`);

        //     done();
        // });
    });
});
