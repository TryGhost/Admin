import {countDownCharacters} from 'ghost-admin/helpers/gh-count-down-characters';
import {module, test} from 'qunit';

module('Unit: Helper: gh-count-down-characters', function () {
    let validStyle = 'color: rgb(48, 207, 67);';
    let errorStyle = 'color: rgb(226, 84, 64);';

    test('counts chars', function (assert) {
        let result = countDownCharacters(['test', 200]);
        assert.strictEqual(result.string, `<span class="word-count" style="${validStyle}">4</span>`);
    });

    test('warns with too many chars', function (assert) {
        let result = countDownCharacters([Array(205 + 1).join('x'), 200]);
        assert.strictEqual(result.string, `<span class="word-count" style="${errorStyle}">205</span>`);
    });

    test('counts multibyte correctly', function (assert) {
        let result = countDownCharacters(['💩', 200]);
        assert.strictEqual(result.string, `<span class="word-count" style="${validStyle}">1</span>`);

        // emoji + modifier is still two chars
        result = countDownCharacters(['💃🏻', 200]);
        assert.strictEqual(result.string, `<span class="word-count" style="${validStyle}">2</span>`);
    });
});
