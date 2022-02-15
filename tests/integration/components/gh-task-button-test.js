import hbs from 'htmlbars-inline-precompile';
import {click, find, render, settled, waitFor} from '@ember/test-helpers';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {run} from '@ember/runloop';
import {setupRenderingTest} from 'ember-mocha';
import {task, timeout} from 'ember-concurrency';

describe('Integration: Component: gh-task-button', function () {
    setupRenderingTest();

    it('renders', async function () {
        // sets button text using positional param
        await render(hbs`<GhTaskButton @buttonText="Test" />`);
        expect(find('button')).to.exist;
        expect(find('button')).to.contain.text('Test');
        expect(find('button').disabled).to.be.false;

        await render(hbs`<GhTaskButton @class="testing" />`);
        expect(find('button')).to.have.class('testing');
        // default button text is "Save"
        expect(find('button')).to.contain.text('Save');

        // passes disabled attr
        await render(hbs`<GhTaskButton @disabled={{true}} @buttonText="Test" />`);
        expect(find('button').disabled).to.be.true;
        // allows button text to be set via hash param
        expect(find('button')).to.contain.text('Test');

        // passes type attr
        await render(hbs`<GhTaskButton @type="submit" />`);
        expect(find('button')).to.have.attr('type', 'submit');

        // passes tabindex attr
        await render(hbs`<GhTaskButton @tabindex="-1" />`);
        expect(find('button')).to.have.attr('tabindex', '-1');
    });

    it('shows spinner whilst running', async function () {
        class Context {
            @task
            *myTask() {
                yield timeout(50);
            }
        }
        const context = new Context();

        this.set('context', context);

        await render(hbs`<GhTaskButton @task={{this.context.myTask}} />`);

        context.myTask.perform();

        await waitFor('button svg', {timeout: 50});
        await settled();
    });

    it('shows running text when passed whilst running', async function () {
        class Context {
            @task
            *myTask() {
                yield timeout(50);
            }
        }
        const context = new Context();

        this.set('context', context);

        await render(hbs`<GhTaskButton @task={{this.context.myTask}} @runningText="Running" />`);

        context.myTask.perform();

        await waitFor('button svg', {timeout: 50});
        expect(find('button')).to.contain.text('Running');

        await settled();
    });

    it('appears disabled whilst running', async function () {
        class Context {
            @task
            *myTask() {
                yield timeout(50);
            }
        }
        const context = new Context();

        this.set('context', context);

        await render(hbs`<GhTaskButton @task={{this.context.myTask}} />`);
        expect(find('button'), 'initial class').to.not.have.class('appear-disabled');

        context.myTask.perform();

        await waitFor('button.appear-disabled', {timeout: 100});
        await settled();

        expect(find('button'), 'ended class').to.not.have.class('appear-disabled');
    });

    it('shows success on success', async function () {
        class Context {
            @task
            *myTask() {
                yield timeout(50);
                return true;
            }
        }
        const context = new Context();

        this.set('context', context);

        await render(hbs`<GhTaskButton @task={{this.context.myTask}} />`);

        await context.myTask.perform();

        expect(find('button')).to.have.class('gh-btn-green');
        expect(find('button')).to.contain.text('Saved');
    });

    it('assigns specified success class on success', async function () {
        class Context {
            @task
            *myTask() {
                yield timeout(50);
                return true;
            }
        }
        const context = new Context();

        this.set('context', context);

        await render(hbs`<GhTaskButton @task={{this.context.myTask}} @successClass="im-a-success" />`);

        await context.myTask.perform();

        expect(find('button')).to.not.have.class('gh-btn-green');
        expect(find('button')).to.have.class('im-a-success');
        expect(find('button')).to.contain.text('Saved');
    });

    it('shows failure when task errors', async function () {
        class Context {
            @task
            *myTask() {
                try {
                    yield timeout(50);
                    throw new ReferenceError('test error');
                } catch (error) {
                    // noop, prevent mocha triggering unhandled error assert
                }
            }
        }
        const context = new Context();

        this.set('context', context);

        await render(hbs`<GhTaskButton @task={{this.context.myTask}} @failureClass="is-failed" />`);

        context.myTask.perform();
        await waitFor('button.is-failed');

        expect(find('button')).to.contain.text('Retry');

        await settled();
    });

    it('shows failure on falsy response', async function () {
        class Context {
            @task
            *myTask() {
                yield timeout(50);
                return false;
            }
        }
        const context = new Context();

        this.set('context', context);

        await render(hbs`<GhTaskButton @task={{this.context.myTask}} />`);

        context.myTask.perform();
        await waitFor('button.gh-btn-red', {timeout: 50});

        expect(find('button')).to.contain.text('Retry');

        await settled();
    });

    it('assigns specified failure class on failure', async function () {
        class Context {
            @task
            *myTask() {
                yield timeout(50);
                return false;
            }
        }
        const context = new Context();

        this.set('context', context);

        await render(hbs`<GhTaskButton @task={{this.context.myTask}} @failureClass="im-a-failure" />`);

        context.myTask.perform();

        await waitFor('button.im-a-failure', {timeout: 50});

        expect(find('button')).to.not.have.class('gh-btn-red');
        expect(find('button')).to.contain.text('Retry');

        await settled();
    });

    it('performs task on click', async function () {
        let taskCount = 0;
        class Context {
            @task
            *myTask() {
                yield timeout(50);
                taskCount = taskCount + 1;
            }
        }
        const context = new Context();

        this.set('context', context);

        await render(hbs`<GhTaskButton @task={{this.context.myTask}} />`);
        await click('button');

        expect(taskCount, 'taskCount').to.equal(1);
    });

    it.skip('keeps button size when showing spinner', async function () {
        class Context {
            @task
            *myTask() {
                yield timeout(50);
            }
        }
        const context = new Context();

        this.set('context', context);

        await render(hbs`<GhTaskButton @task={{this.context.myTask}} />`);
        let width = find('button').clientWidth;
        let height = find('button').clientHeight;
        expect(find('button')).to.not.have.attr('style');

        context.myTask.perform();

        run.later(this, function () {
            // we can't test exact width/height because Chrome/Firefox use different rounding methods
            // expect(find('button')).to.have.attr('style', `width: ${width}px; height: ${height}px;`);

            let [widthInt] = width.toString().split('.');
            let [heightInt] = height.toString().split('.');

            expect(find('button')).to.have.attr('style', `width: ${widthInt}`);
            expect(find('button')).to.have.attr('style', `height: ${heightInt}`);
        }, 20);

        run.later(this, function () {
            expect(find('button').getAttribute('style')).to.be.empty;
        }, 100);

        await settled();
    });
});
