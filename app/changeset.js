import {A as emberA} from 'ember-array/utils';
import {isNone} from 'ember-utils';

import {changeset} from 'ember-changeset';
import lookupValidator from 'ember-changeset-validations';

const {keys} = Object;

/**
 * Overrides of the base ember-changeset class. This is
 * needed to implement some of our own custom validation logic as
 * well as handle some of the setup needed to make validations work
 * correctly
 *
 * @class Changeset
 * @extends ember-changeset
 */
export default class Changeset {
    constructor(obj, validationMap) {
        let BaseChangeset = changeset(obj, lookupValidator(validationMap));

        return BaseChangeset.extend({

            /**
             * Array of validated keys
             * @type Array
             */
            hasValidated: null,

            init() {
                this._super(...arguments);
                this.set('hasValidated', emberA());
            },

            addError(key, validation) {
                this.get('hasValidated').pushObject(key);

                return this._super(key, {
                    value: this.get(key),
                    validation
                });
            },

            rollback() {
                this.clear();

                return this._super(...arguments);
            },

            validate(key) {
                let hasValidated = this.get('hasValidated');

                if (isNone(key)) {
                    hasValidated.pushObjects(keys(validationMap));
                } else {
                    hasValidated.pushObject(key);
                }

                return this._super(...arguments);
            },

            clear(key) {
                if (isNone(key)) {
                    this.get('hasValidated').clear();
                    return;
                }

                this.get('hasValidated').removeObject(key);
            }
        }).create();
    }
}
