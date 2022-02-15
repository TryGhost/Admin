import moment from 'moment';
import {module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

module('Unit: Service: membersStats', function (hooks) {
    setupTest(hooks);

    let memberStatsService;

    hooks.beforeEach(function () {
        memberStatsService = this.owner.lookup('service:membersStats');
    });

    test('fills correct date and value for mrr data when no data points', function (assert) {
        const data = [];
        const output = memberStatsService.fillDates(data);
        const values = Object.values(output);
        const keys = Object.keys(output);

        assert.strictEqual(values[0], 0);
        assert.strictEqual(keys[0], moment().subtract(30, 'days').format('YYYY-MM-DD'));
        assert.strictEqual(keys[keys.length - 1], moment().format('YYYY-MM-DD'));
        assert.strictEqual(values[values.length - 1], 0);
    });

    test('fills correct date and value for mrr data when no data point in range', function (assert) {
        const data = [
            {
                date: moment().subtract(40, 'days').format('YYYY-MM-DD'),
                value: 10459
            },
            {
                date: moment().subtract(31, 'days').format('YYYY-MM-DD'),
                value: 14459
            }
        ];
        const output = memberStatsService.fillDates(data);
        const values = Object.values(output);
        const keys = Object.keys(output);

        assert.strictEqual(values[0], 14459);
        assert.strictEqual(keys[0], moment().subtract(30, 'days').format('YYYY-MM-DD'));
        assert.strictEqual(keys[keys.length - 1], moment().format('YYYY-MM-DD'));
        assert.strictEqual(values[values.length - 1], 14459);
    });

    test('fills correct date and value for mrr data when first data point outside range', function (assert) {
        const data = [
            {
                date: moment().subtract(31, 'days').format('YYYY-MM-DD'),
                value: 14459
            },
            {
                date: moment().subtract(10, 'days').format('YYYY-MM-DD'),
                value: 98176
            }
        ];
        const output = memberStatsService.fillDates(data);
        const values = Object.values(output);
        const keys = Object.keys(output);

        assert.strictEqual(values[0], 14459);
        assert.strictEqual(keys[0], moment().subtract(30, 'days').format('YYYY-MM-DD'));
        assert.strictEqual(keys[keys.length - 1], moment().format('YYYY-MM-DD'));
        assert.strictEqual(values[values.length - 1], 98176);
    });

    test('fills correct date and value for mrr data when only 1 data point in range', function (assert) {
        const data = [
            {
                date: moment().subtract(29, 'days').format('YYYY-MM-DD'),
                value: 14459
            }
        ];
        const output = memberStatsService.fillDates(data);
        const values = Object.values(output);
        const keys = Object.keys(output);

        assert.strictEqual(values[0], 14459);
        assert.strictEqual(keys[0], moment().subtract(30, 'days').format('YYYY-MM-DD'));
        assert.strictEqual(keys[keys.length - 1], moment().format('YYYY-MM-DD'));
        assert.strictEqual(values[values.length - 1], 14459);
    });
});
