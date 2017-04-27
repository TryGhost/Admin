/* jshint expr:true */
import {describe, it} from 'mocha';
import {setupComponentTest} from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import {testEditorInput, EMPTY_DOC} from '../../helpers/editor-helpers';
import sinon from 'sinon';

describe('Integration: Component: gh-koenig', function () {
    setupComponentTest('gh-koenig', {
        integration: true
    });

    beforeEach(function () {
        // set defaults
        this.set('onFirstChange', sinon.spy());
        this.set('onChange', sinon.spy());

        this.set('wordcount', 0);
        this.set('actions.wordcountDidChange', function (wordcount) {
            this.set('wordcount', wordcount);
        });

        this.set('value', EMPTY_DOC);
    });

    it('Check that events have fired', async function () {
        this.render(hbs`{{gh-koenig
                                apiRoot='/todo'
                                assetPath='/assets'
                                containerSelector='.gh-koenig-container'
                                mobiledoc=value
                                onChange=(action onChange)
                                onFirstChange=(action onFirstChange)
                                wordcountDidChange=(action 'wordcountDidChange')
                            }}`);

        await testEditorInput('abcd efg hijk lmnop', '<p>abcd efg hijk lmnop</p>', expect);

        expect(this.get('onFirstChange').calledOnce, 'onFirstChanged called once').to.be.true;
        expect(this.get('onChange').called, 'onChange called').to.be.true;
        expect(this.get('wordcount'), 'wordcount').to.equal(4);
    });
});
