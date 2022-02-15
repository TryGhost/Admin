import {ghUserCanAdmin} from 'ghost-admin/helpers/gh-user-can-admin';
import {module, test} from 'qunit';

module('Unit: Helper: gh-user-can-admin', function () {
    // Mock up roles and test for truthy
    module('Owner or admin roles', function () {
        let user = {
            get(role) {
                if (role === 'isAdmin') {
                    return true;
                }
                throw new Error('unsupported'); // Make sure we only call get('isAdmin')
            }
        };

        test(' - can be Admin', function (assert) {
            let result = ghUserCanAdmin([user]);
            assert.true(result);
        });
    });

    module('Editor, Author & Contributor roles', function () {
        let user = {
            get(role) {
                if (role === 'isAdmin') {
                    return false;
                }
                throw new Error('unsupported'); // Make sure we only call get('isAdmin')
            }
        };

        test(' - cannot be Admin', function (assert) {
            let result = ghUserCanAdmin([user]);
            assert.false(result);
        });
    });
});
