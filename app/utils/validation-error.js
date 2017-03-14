import Ember from 'ember';

const {Error: EmberError} = Ember;

// TODO: this should probably be merged with ember-ajax's InvalidError class
// so that we can standardize error handling across the admin client
export function ValidationError(errors) {
    this.errors = errors;

    let errorKeys = errors.getEach('key').uniq();
    let message = `Invalid key(s): ${errorKeys.join(', ')}`;

    EmberError.call(this, message);
}

ValidationError.prototype = Object.create(EmberError.prototype);

export function isValidationError(error) {
    return error instanceof ValidationError;
}
