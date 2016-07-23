import Service from 'ember-service';
import RSVP from 'rsvp';
import run, {cancel} from 'ember-runloop';

const {resolve} = RSVP;

/**
 * A general purpose scheduler to manage namespaced promises
 * and timed run events
 */
export default Service.extend({
    promises: {},
    timers: {},

    promise(name, promiseFn) {
        let existingPromise = this.get(`promises.${name}`);
        let promise = resolve(existingPromise).then(promiseFn);

        this.set(`promises.${name}`, promise);
        return promise;
    },

    timer(name, method, ...timerArgs) {
        let runMethod = run[method];
        let timer = runMethod(...timerArgs);

        this.set(`timers.${name}`, timer);
        return timer;
    },

    cancel(name) {
        let timer = this.get(`timers.${name}`);

        if (timer) {
            this.set(`timers.${name}`, null);
            return cancel(timer);
        }

        return false;
    }
});
