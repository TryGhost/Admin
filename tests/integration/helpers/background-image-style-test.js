import hbs from 'htmlbars-inline-precompile';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {find} from '@ember/test-helpers';
import {setupComponentTest} from 'ember-mocha';

describe('Integration: Helper: background-image-style', function () {
    setupComponentTest('background-image-style', {
        integration: true
    });

    it('renders', function () {
        this.render(hbs`{{background-image-style "test.png"}}`);
        expect(find('*').textContent.trim()).to.equal('background-image: url(test.png);');
    });

    it('escapes URLs', function () {
        this.render(hbs`{{background-image-style "test image.png"}}`);
        expect(find('*').textContent.trim()).to.equal('background-image: url(test%20image.png);');
    });

    it('handles already escaped URLs', function () {
        this.render(hbs`{{background-image-style "test%20image.png"}}`);
        expect(find('*').textContent.trim()).to.equal('background-image: url(test%20image.png);');
    });

    it('handles empty URLs', function () {
        this.set('testImage', undefined);
        this.render(hbs`{{background-image-style testImage}}`);
        expect(find('*').textContent.trim(), 'undefined').to.equal('');

        this.set('testImage', null);
        this.render(hbs`{{background-image-style testImage}}`);
        expect(find('*').textContent.trim(), 'null').to.equal('');

        this.set('testImage', '');
        this.render(hbs`{{background-image-style testImage}}`);
        expect(find('*').textContent.trim(), 'blank').to.equal('');
    });
});
