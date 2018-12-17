import hbs from 'htmlbars-inline-precompile';
import {click, find, render, settled} from '@ember/test-helpers';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {run} from '@ember/runloop';
import {setupRenderingTest} from 'ember-mocha';
import {task, timeout} from 'ember-concurrency';

describe('Integration: Component: gh-task-button', function () {
    setupRenderingTest();

    it('renders', async function () {
        // sets button text using positional param
        await render(hbs`{{gh-task-button "Test"}}`);
        expect(find('button')).to.exist;
        expect(find('button')).to.contain.text('Test');
        expect(find('button').disabled).to.be.false;

        await render(hbs`{{gh-task-button class="testing"}}`);
        expect(find('button')).to.have.class('testing');
        // default button text is "Save"
        expect(find('button')).to.contain.text('Save');

        // passes disabled attr
        await render(hbs`{{gh-task-button disabled=true buttonText="Test"}}`);
        expect(find('button').disabled).to.be.true;
        // allows button text to be set via hash param
        expect(find('button')).to.contain.text('Test');

        // passes type attr
        await render(hbs`{{gh-task-button type="submit"}}`);
        expect(find('button')).to.have.attr('type', 'submit');

        // passes tabindex attr
        await render(hbs`{{gh-task-button tabindex="-1"}}`);
        expect(find('button')).to.have.attr('tabindex', '-1');
    });

    it('shows spinner whilst running', async function () {
        this.set('myTask', task(function* () {
            yield timeout(50);
        }));

        await render(hbs`{{gh-task-button task=myTask}}`);

        this.get('myTask').perform();

        run.later(this, function () {
            expect(find('button')).to.have.descendants('svg');
        }, 20);

        await settled();
    });

    it('shows running text when passed whilst running', async function () {
        this.set('myTask', task(function* () {
            yield timeout(50);
        }));

        await render(hbs`{{gh-task-button task=myTask runningText="Running"}}`);

        this.get('myTask').perform();

        run.later(this, function () {
            expect(find('button')).to.have.descendants('svg');
            expect(find('button')).to.contain.text('Running');
        }, 20);

        await settled();
    });

    it('appears disabled whilst running', async function () {
        this.set('myTask', task(function* () {
            yield timeout(50);
        }));

        await render(hbs`{{gh-task-button task=myTask}}`);
        expect(find('button'), 'initial class').to.not.have.class('appear-disabled');

        this.get('myTask').perform();

        run.later(this, function () {
            expect(find('button'), 'running class').to.have.class('appear-disabled');
        }, 20);

        run.later(this, function () {
            expect(find('button'), 'ended class').to.not.have.class('appear-disabled');
        }, 100);

        await settled();
    });

    it('shows success on success', async function () {
        this.set('myTask', task(function* () {
            yield timeout(50);
            return true;
        }));

        await render(hbs`{{gh-task-button task=myTask}}`);

        this.get('myTask').perform();

        run.later(this, function () {
            expect(find('button')).to.have.class('gh-btn-green');
            expect(find('button')).to.contain.text('Saved');
        }, 100);

        await settled();
    });

    it('assigns specified success class on success', async function () {
        this.set('myTask', task(function* () {
            yield timeout(50);
            return true;
        }));

        await render(hbs`{{gh-task-button task=myTask successClass="im-a-success"}}`);

        this.get('myTask').perform();

        run.later(this, function () {
            expect(find('button')).to.not.have.class('gh-btn-green');
            expect(find('button')).to.have.class('im-a-success');
            expect(find('button')).to.contain.text('Saved');
        }, 100);

        await settled();
    });

    it('shows failure when task errors', async function () {
        this.set('myTask', task(function* () {
            try {
                yield timeout(50);
                throw new ReferenceError('test error');
            } catch (error) {
                // noop, prevent mocha triggering unhandled error assert
            }
        }));

        await render(hbs`{{gh-task-button task=myTask}}`);

        this.get('myTask').perform();

        run.later(this, function () {
            expect(find('button')).to.have.class('gh-btn-red');
            expect(find('button')).to.contain.text('Retry');
        }, 100);

        await settled();
    });

    it('shows failure on falsy response', async function () {
        this.set('myTask', task(function* () {
            yield timeout(50);
            return false;
        }));

        await render(hbs`{{gh-task-button task=myTask}}`);

        this.get('myTask').perform();

        run.later(this, function () {
            expect(find('button')).to.have.class('gh-btn-red');
            expect(find('button')).to.contain.text('Retry');
        }, 100);

        await settled();
    });

    it('assigns specified failure class on failure', async function () {
        this.set('myTask', task(function* () {
            yield timeout(50);
            return false;
        }));

        await render(hbs`{{gh-task-button task=myTask failureClass="im-a-failure"}}`);

        this.get('myTask').perform();

        run.later(this, function () {
            expect(find('button')).to.not.have.class('gh-btn-red');
            expect(find('button')).to.have.class('im-a-failure');
            expect(find('button')).to.contain.text('Retry');
        }, 100);

        await settled();
    });

    it('performs task on click', async function () {
        let taskCount = 0;

        this.set('myTask', task(function* () {
            yield timeout(50);
            taskCount = taskCount + 1;
        }));

        await render(hbs`{{gh-task-button task=myTask}}`);
        await click('button');

        await settled().then(() => {
            expect(taskCount, 'taskCount').to.equal(1);
        });
    });

    it.skip('keeps button size when showing spinner', async function () {
        this.set('myTask', task(function* () {
            yield timeout(50);
        }));

        await render(hbs`{{gh-task-button task=myTask}}`);
        let width = find('button').clientWidth;
        let height = find('button').clientHeight;
        expect(find('button')).to.not.have.attr('style');

        this.get('myTask').perform();

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
