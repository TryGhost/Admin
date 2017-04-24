/* jshint expr:true */
import {describe, it} from 'mocha';
import {setupComponentTest} from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import {editorRendered, inputText} from '../../helpers/editor-helpers';

describe.skip('Integration: Component: gh-koenig - General Editor Tests.', function () {
    setupComponentTest('gh-koenig', {
        integration: true
    });

    beforeEach(function () {
        // set defaults
        this.set('changeFired', false);
        this.set('firstChangeFired', false);

        this.set('actions.onFirstChange', function () {
            this.set('firstChangeFired', true);
        });

        this.set('actions.onChange', function () {
            this.set('changeFired', true);
        });

        this.set('wordCount', 0);
    });

    it('Check that events have fired', function (done) {
        this.render(hbs`{{gh-koenig
                            apiRoot='/todo'
                            assetPath='/assets'
                            containerSelector='.editor-holder'
                            onChange=(action "onChange")
                            onFirstChange=(action "onFirstChange")
                            wordCount=wordCount
                        }}`);

        editorRendered()
            .then(() => {
                let {editor} = window;
                editor.element.focus();
                inputText(editor, 'this is a test.');
                window.setTimeout(() => {
                    expect(this.get('wordCount')).to.equal(5);
                    expect(this.get('changeFired')).to.be.true;
                    expect(this.get('firstChangeFired')).to.be.true;
                    done();
                }, 1100);
            });
    });
});