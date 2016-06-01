import BaseValidator from './base';
import isBlank from 'ember-utils/isBlank';
import isEmail from 'validator/lib/isEmail';
import isURL from 'validator/lib/isURL';
import isLength from 'validator/lib/isLength';

export default BaseValidator.create({
    properties: ['name', 'bio', 'email', 'location', 'website', 'roles'],

    isActive(model) {
        return (model.get('status') === 'active');
    },

    name(model) {
        let name = model.get('name');

        if (this.isActive(model)) {
            if (isBlank(name)) {
                model.get('errors').add('name', 'Please enter a name.');
                this.invalidate();
            } else if (!isLength(name, 0, 150)) {
                model.get('errors').add('name', 'Name is too long');
                this.invalidate();
            }
        }
    },

    bio(model) {
        let bio = model.get('bio');

        if (this.isActive(model)) {
            if (!isLength(bio, 0, 200)) {
                model.get('errors').add('bio', 'Bio is too long');
                this.invalidate();
            }
        }
    },

    email(model) {
        let email = model.get('email');

        if (!isEmail(email)) {
            model.get('errors').add('email', 'Please supply a valid email address');
            this.invalidate();
        }
    },

    location(model) {
        let location = model.get('location');

        if (this.isActive(model)) {
            if (!isLength(location, 0, 150)) {
                model.get('errors').add('location', 'Location is too long');
                this.invalidate();
            }
        }
    },

    website(model) {
        let website = model.get('website');

        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        if (this.isActive(model)) {
            if (!isBlank(website) &&
                (!isURL(website, {require_protocol: false}) ||
                !isLength(website, 0, 2000))) {

                model.get('errors').add('website', 'Website is not a valid url');
                this.invalidate();
            }
        }
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
    },

    roles(model) {
        if (!this.isActive(model)) {
            let roles = model.get('roles');

            if (roles.length < 1) {
                model.get('errors').add('role', 'Please select a role');
                this.invalidate();
            }
        }
    }
});
