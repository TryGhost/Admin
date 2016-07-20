import {A as emberA, isEmberArray} from 'ember-array/utils';
import {isNone, isPresent} from 'ember-utils';
import RSVP from 'rsvp';
import Ember from 'ember';
import get from 'ember-metal/get';
import set from 'ember-metal/set';

import {changeset} from 'ember-changeset';
import lookupValidator from 'ember-changeset-validations';

const {keys} = Object;
const {typeOf} = Ember;
const {resolve, all} = RSVP;

// Pulled from ember-changeset
const CHANGES = '_changes';
const ERRORS = '_errors';

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

                if (typeOf(validation) === 'object') {
                    return this._super(key, validation);
                }

                return this._super(key, {
                    value: this.get(key),
                    validation
                });
            },

            rollback() {
                this.clear();

                return this._super(...arguments);
            },

            /**
             * re-implementation of super method with hasValidated additions
             *
             * This is necessary because calling this._super(...arguments) doesn't
             * seem to work in this instance for some strange reason
             *
             * @method validate
             * @param  {String|null} key
             * @return {Promise}
             */
            validate(key) {
                if (keys(validationMap).length === 0) {
                    return resolve(null);
                }

                let hasValidated = this.get('hasValidated');

                if (isNone(key)) {
                    let maybePromise = keys(validationMap)
                        .map((validationKey) => {
                            hasValidated.pushObject(validationKey);
                            return this._validateAndSet(validationKey, this._valueFor(validationKey));
                        });

                    return all(maybePromise);
                }

                hasValidated.pushObject(key);
                return resolve(this._validateAndSet(key, this._valueFor(key)));
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
