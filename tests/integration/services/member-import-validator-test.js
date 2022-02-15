import Pretender from 'pretender';
import Service from '@ember/service';
import {module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

let MembersUtilsStub = Service.extend({
    isStripeEnabled: true
});

module('Integration: Service: member-import-validator', function (hooks) {
    setupTest(hooks);

    let server;

    beforeEach(function () {
        server = new Pretender();
        this.owner.register('service:membersUtils', MembersUtilsStub);
    });

    afterEach(function () {
        server.shutdown();
    });

    test('checks correct data without Stripe customer', async function (assert) {
        let service = this.owner.lookup('service:member-import-validator');

        const mapping = await service.check([{
            name: 'Rish',
            email: 'validemail@example.com'
        }]);

        assert.strictEqual(mapping.email, 'email');
    });

    module('data sampling method', function () {
        test('returns whole data set when sampled size is less then default 30', async function (assert) {
            this.owner.register('service:membersUtils', Service.extend({
                isStripeEnabled: false
            }));

            let service = this.owner.lookup('service:member-import-validator');

            const result = await service._sampleData([{
                email: 'email@example.com'
            }, {
                email: 'email2@example.com'
            }]);

            assert.strictEqual(result.length, 2);
        });

        test('returns dataset with sample size for non empty values only', async function (assert) {
            this.owner.register('service:membersUtils', Service.extend({
                isStripeEnabled: false
            }));

            let service = this.owner.lookup('service:member-import-validator');
            let data = [{
                email: null
            }, {
                email: 'email2@example.com'
            }, {
                email: 'email3@example.com'
            }, {
                email: 'email4@example.com'
            }, {
                email: ''
            }];

            const result = await service._sampleData(data, 3);

            assert.strictEqual(result.length, 3);
            assert.strictEqual(result[0].email, 'email2@example.com');
            assert.strictEqual(result[1].email, 'email3@example.com');
            assert.strictEqual(result[2].email, 'email4@example.com');
        });

        test('returns dataset with sample size for non empty values for objects with multiple properties', async function (assert) {
            this.owner.register('service:membersUtils', Service.extend({
                isStripeEnabled: false
            }));

            let service = this.owner.lookup('service:member-import-validator');
            let data = [{
                email: null,
                other_prop: 'non empty 1'
            }, {
                email: 'email2@example.com',
                other_prop: 'non empty 2'
            }, {
                email: 'email3@example.com',
                other_prop: ''
            }, {
                email: 'email4@example.com'
            }, {
                email: '',
                other_prop: 'non empty 5'
            }];

            const result = await service._sampleData(data, 3);

            assert.strictEqual(result.length, 3);
            assert.strictEqual(result[0].email, 'email2@example.com');
            assert.strictEqual(result[0].other_prop, 'non empty 1');
            assert.strictEqual(result[1].email, 'email3@example.com');
            assert.strictEqual(result[1].other_prop, 'non empty 2');
            assert.strictEqual(result[2].email, 'email4@example.com');
            assert.strictEqual(result[2].other_prop, 'non empty 5');
        });
    });

    module('data detection method', function () {
        test('correctly detects only email mapping', async function (assert) {
            this.owner.register('service:membersUtils', Service.extend({
                isStripeEnabled: false
            }));

            let service = this.owner.lookup('service:member-import-validator');

            const result = service._detectDataTypes([{
                correo_electronico: 'email@example.com'
            }, {
                correo_electronico: 'email2@example.com'
            }]);

            assert.strictEqual(result.email, 'correo_electronico');
            assert.strictEqual(result.stripe_customer_id, undefined);
        });

        test('correctly detects only email mapping', async function (assert) {
            this.owner.register('service:membersUtils', Service.extend({
                isStripeEnabled: false
            }));

            let service = this.owner.lookup('service:member-import-validator');

            const result = service._detectDataTypes([{
                correo_electronico: 'email@example.com',
                stripe_id: ''
            }, {
                correo_electronico: '',
                stripe_id: 'cus_'
            }]);

            assert.strictEqual(result.email, 'correo_electronico');
        });

        test('correctly detects variation of "name" mapping', async function (assert) {
            this.owner.register('service:membersUtils', Service.extend({
                isStripeEnabled: false
            }));

            let service = this.owner.lookup('service:member-import-validator');

            const result = service._detectDataTypes([{
                first_name: 'Rish'
            }]);

            assert.strictEqual(result.name, 'first_name');
        });
    });
});
