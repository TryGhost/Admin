import ghostPaths from 'ghost-admin/utils/ghost-paths';
import {module, test} from 'qunit';

module('Unit: Util: ghost-paths', function () {
    module('join', function () {
        let {join} = ghostPaths().url;

        test('should join two or more paths, normalizing slashes', function (assert) {
            let path;

            path = join('/one/', '/two/');
            assert.strictEqual(path, '/one/two/');

            path = join('/one', '/two/');
            assert.strictEqual(path, '/one/two/');

            path = join('/one/', 'two/');
            assert.strictEqual(path, '/one/two/');

            path = join('/one/', 'two/', '/three/');
            assert.strictEqual(path, '/one/two/three/');

            path = join('/one/', 'two', 'three/');
            assert.strictEqual(path, '/one/two/three/');
        });

        test('should not change the slash at the beginning', function (assert) {
            let path;

            path = join('one/');
            assert.strictEqual(path, 'one/');
            path = join('one/', 'two');
            assert.strictEqual(path, 'one/two/');
            path = join('/one/', 'two');
            assert.strictEqual(path, '/one/two/');
            path = join('one/', 'two', 'three');
            assert.strictEqual(path, 'one/two/three/');
            path = join('/one/', 'two', 'three');
            assert.strictEqual(path, '/one/two/three/');
        });

        test('should always return a slash at the end', function (assert) {
            let path;

            path = join();
            assert.strictEqual(path, '/');
            path = join('');
            assert.strictEqual(path, '/');
            path = join('one');
            assert.strictEqual(path, 'one/');
            path = join('one/');
            assert.strictEqual(path, 'one/');
            path = join('one', 'two');
            assert.strictEqual(path, 'one/two/');
            path = join('one', 'two/');
            assert.strictEqual(path, 'one/two/');
        });
    });
});
