import getOwner from 'ember-owner/get';

/**
 * This is used as a shortcut to create an object with owner injection
 * @param  {any} ObjectClass        Ember Object to create
 * @param  {any} objectWithOwner    Object that `getOwner` is valid for
 * @param  {Object} createOptions   Object to be passed to the `create` function
 * @return {any}                    The containerized object
 */
export default function createContainerObject(ObjectClass, objectWithOwner, createOptions = {}) {
    return ObjectClass.create(getOwner(objectWithOwner).ownerInjection(), createOptions);
}
