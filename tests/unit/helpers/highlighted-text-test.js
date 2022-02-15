import {
    highlightedText
} from 'ghost-admin/helpers/highlighted-text';
import {module, test} from 'qunit';

module('Unit: Helper: highlighted-text', function () {
    test('works', function (assert) {
        let result = highlightedText(['Test', 'e']);
        assert.instanceOf(Object, result);
        assert.strictEqual(result.string, 'T<span class="highlight">e</span>st');
    });
});
