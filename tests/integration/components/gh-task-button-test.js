import hbs from 'htmlbars-inline-precompile';
import {click, find, render, settled, waitFor} from '@ember/test-helpers';
import {defineProperty} from '@ember/object';
import {module, skip, test} from 'qunit';
import {run} from '@ember/runloop';
import {setupRenderingTest} from 'ember-qunit';
import {task, timeout} from 'ember-concurrency';

module('Integration: Component: gh-task-button', function (hooks) {
    setupRenderingTest(hooks);

    test('renders', async function (assert) {
        // sets button text using positional param
        await render(hbs`<GhTaskButton @buttonText="Test" />`);
        assert.dom('button').exists();
        assert.dom('button').hasText('Test');
        assert.false(find('button').disabled);

        await render(hbs`<GhTaskButton @class="testing" />`);
        assert.dom('button').hasClass('testing');
        // default button text is "Save"
        assert.dom('button').hasText('Save');

        // passes disabled attr
        await render(hbs`<GhTaskButton @disabled={{true}} @buttonText="Test" />`);
        assert.true(find('button').disabled);
        // allows button text to be set via hash param
        assert.dom('button').hasText('Test');

        // passes type attr
        await render(hbs`<GhTaskButton @type="submit" />`);
        assert.dom('button').hasAttribute('type', 'submit');

        // passes tabindex attr
        await render(hbs`<GhTaskButton @tabindex="-1" />`);
        assert.dom('button').hasAttribute('tabindex', '-1');
    });

    test('shows spinner whilst running', async function () {
        defineProperty(this, 'myTask', task(function* () {
            yield timeout(50);
        }));

        await render(hbs`<GhTaskButton @task={{myTask}} />`);

        this.myTask.perform();

        await waitFor('button svg', {timeout: 50});
        await settled();
    });

    test('shows running text when passed whilst running', async function (assert) {
        defineProperty(this, 'myTask', task(function* () {
            yield timeout(50);
        }));

        await render(hbs`<GhTaskButton @task={{myTask}} @runningText="Running" />`);

        this.myTask.perform();

        await waitFor('button svg', {timeout: 50});
        assert.dom('button').hasText('Running');

        await settled();
    });

    test('appears disabled whilst running', async function (assert) {
        defineProperty(this, 'myTask', task(function* () {
            yield timeout(50);
        }));

        await render(hbs`<GhTaskButton @task={{myTask}} />`);
        assert.dom('button').doesNotHaveClass('appear-disabled', 'initial class');

        this.myTask.perform();

        await waitFor('button.appear-disabled', {timeout: 100});
        await settled();

        assert.dom('button').doesNotHaveClass('appear-disabled', 'ended class');
    });

    test('shows success on success', async function (assert) {
        defineProperty(this, 'myTask', task(function* () {
            yield timeout(50);
            return true;
        }));

        await render(hbs`<GhTaskButton @task={{myTask}} />`);

        await this.myTask.perform();

        assert.dom('button').hasClass('gh-btn-green');
        assert.dom('button').hasText('Saved');
    });

    test('assigns specified success class on success', async function (assert) {
        defineProperty(this, 'myTask', task(function* () {
            yield timeout(50);
            return true;
        }));

        await render(hbs`<GhTaskButton @task={{myTask}} @successClass="im-a-success" />`);

        await this.myTask.perform();

        assert.dom('button').doesNotHaveClass('gh-btn-green');
        assert.dom('button').hasClass('im-a-success');
        assert.dom('button').hasText('Saved');
    });

    test('shows failure when task errors', async function (assert) {
        defineProperty(this, 'myTask', task(function* () {
            try {
                yield timeout(50);
                throw new ReferenceError('test error');
            } catch (error) {
                // noop, prevent mocha triggering unhandled error assert
            }
        }));

        await render(hbs`<GhTaskButton @task={{myTask}} @failureClass="is-failed" />`);

        this.myTask.perform();
        await waitFor('button.is-failed');

        assert.dom('button').hasText('Retry');

        await settled();
    });

    test('shows failure on falsy response', async function (assert) {
        defineProperty(this, 'myTask', task(function* () {
            yield timeout(50);
            return false;
        }));

        await render(hbs`<GhTaskButton @task={{myTask}} />`);

        this.myTask.perform();
        await waitFor('button.gh-btn-red', {timeout: 50});

        assert.dom('button').hasText('Retry');

        await settled();
    });

    test('assigns specified failure class on failure', async function (assert) {
        defineProperty(this, 'myTask', task(function* () {
            yield timeout(50);
            return false;
        }));

        await render(hbs`<GhTaskButton @task={{myTask}} @failureClass="im-a-failure" />`);

        this.myTask.perform();

        await waitFor('button.im-a-failure', {timeout: 50});

        assert.dom('button').doesNotHaveClass('gh-btn-red');
        assert.dom('button').hasText('Retry');

        await settled();
    });

    test('performs task on click', async function (assert) {
        let taskCount = 0;

        defineProperty(this, 'myTask', task(function* () {
            yield timeout(50);
            taskCount = taskCount + 1;
        }));

        await render(hbs`<GhTaskButton @task={{myTask}} />`);
        await click('button');

        assert.strictEqual(taskCount, 1, 'taskCount');
    });

    skip('keeps button size when showing spinner', async function (assert) {
        defineProperty(this, 'myTask', task(function* () {
            yield timeout(50);
        }));

        await render(hbs`<GhTaskButton @task={{myTask}} />`);
        let width = find('button').clientWidth;
        let height = find('button').clientHeight;
        assert.dom('button').doesNotHaveAttribute('style');

        this.myTask.perform();

        run.later(this, function () {
            // we can't test exact width/height because Chrome/Firefox use different rounding methods
            // expect(find('button')).to.have.attr('style', `width: ${width}px; height: ${height}px;`);

            let [widthInt] = width.toString().split('.');
            let [heightInt] = height.toString().split('.');

            assert.dom('button').hasAttribute('style', `width: ${widthInt}`);
            assert.dom('button').hasAttribute('style', `height: ${heightInt}`);
        }, 20);

        run.later(this, function () {
            assert.notOk(find('button').getAttribute('style'));
        }, 100);

        await settled();
    });
});
