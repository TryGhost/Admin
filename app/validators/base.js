import EmberObject from '@ember/object';
import RSVP from 'rsvp';

/**
 * Base validator that all validators should extend
 * Handles checking of individual properties or the entire model
 */
export default EmberObject.extend({
    properties: [],
    passed: false,

    /**
     * When passed a model and (optionally) a property name,
     * checks it against a list of validation functions
     * @param  {Ember.Object} model Model to validate
     * @param  {string} prop  Property name to check
     * @return {boolean}      True if the model passed all (or one) validation(s),
     *                        false if not
     */
    check(model, prop) {
        let promises = [];
        this.set('passed', true);

        if (prop && this[prop]) {
            promises.push(this[prop](model));
        } else {
            this.get('properties').forEach((property) => {
                if (this[property]) {
                    promises.push(this[property](model));
                }
            });
        }

        return RSVP.all(promises).then(() => {
            return this.get('passed');
        });
    },

    invalidate() {
        this.set('passed', false);
    }
});
