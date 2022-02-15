import {countCharacters} from 'ghost-admin/helpers/gh-count-characters';
import {module, test} from 'qunit';

module('Unit: Helper: gh-count-characters', function () {
    let defaultStyle = 'color: rgb(69, 195, 46);';
    let errorStyle = 'color: rgb(240, 82, 48);';

    test('counts remaining chars', function (assert) {
        let result = countCharacters(['test']);
        assert.strictEqual(result.string, `<span class="word-count" style="${defaultStyle}">196</span>`);
    });

    test('warns when nearing limit', function (assert) {
        let result = countCharacters([Array(195 + 1).join('x')]);
        assert.strictEqual(result.string, `<span class="word-count" style="${errorStyle}">5</span>`);
    });

    test('indicates too many chars', function (assert) {
        let result = countCharacters([Array(205 + 1).join('x')]);
        assert.strictEqual(result.string, `<span class="word-count" style="${errorStyle}">-5</span>`);
    });

    test('counts multibyte correctly', function (assert) {
        let result = countCharacters(['💩']);
        assert.strictEqual(result.string, `<span class="word-count" style="${defaultStyle}">199</span>`);

        // emoji + modifier is still two chars
        result = countCharacters(['💃🏻']);
        assert.strictEqual(result.string, `<span class="word-count" style="${defaultStyle}">198</span>`);
    });
});
