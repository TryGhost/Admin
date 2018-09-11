import PasswordValidator from 'ghost-admin/validators/password';
import validator from 'npm:validator';
import {isBlank} from '@ember/utils';

export default PasswordValidator.create({
    properties: ['name', 'bio', 'email', 'location', 'website', 'roles'],

    isActive(model) {
        return (model.get('status') === 'active');
    },

    name(model) {
        let name = model.get('name');

        if (this.isActive(model)) {
            if (isBlank(name)) {
                model.get('errors').add('name', this.t('validation.Please enter a name.'));
                this.invalidate();
            } else if (!validator.isLength(name, 0, 191)) {
                model.get('errors').add('name', this.t('validation.Name is too long'));
                this.invalidate();
            }
        }
    },

    bio(model) {
        let bio = model.get('bio');

        if (this.isActive(model)) {
            if (!validator.isLength(bio || '', 0, 200)) {
                model.get('errors').add('bio', this.t('validation.Bio is too long'));
                this.invalidate();
            }
        }
    },

    email(model) {
        let email = model.get('email');

        if (!validator.isEmail(email || '')) {
            model.get('errors').add('email', this.t('validation.Please supply a valid email address'));
            this.invalidate();
        }

        if (!validator.isLength(email || '', 0, 191)) {
            model.get('errors').add('email', this.t('validation.Email is too long'));
            this.invalidate();
        }
    },

    location(model) {
        let location = model.get('location');

        if (this.isActive(model)) {
            if (!validator.isLength(location || '', 0, 150)) {
                model.get('errors').add('location', this.t('validation.Location is too long'));
                this.invalidate();
            }
        }
    },

    website(model) {
        let website = model.get('website');
        // eslint-disable-next-line camelcase
        let isInvalidWebsite = !validator.isURL(website || '', {require_protocol: false})
                          || !validator.isLength(website || '', 0, 2000);

        if (this.isActive(model)) {
            if (!isBlank(website) && isInvalidWebsite) {
                model.get('errors').add('website', this.t('validation.Website is not a valid url'));
                this.invalidate();
            }
        }
    },

    roles(model) {
        if (!this.isActive(model)) {
            let roles = model.get('roles');

            if (roles.length < 1) {
                model.get('errors').add('role', this.t('validation.Please select a role'));
                this.invalidate();
            }
        }
    },

    passwordChange(model) {
        let newPassword = model.get('newPassword');
        let ne2Password = model.get('ne2Password');

        // validation only marks the requested property as validated so we
        // have to add properties manually
        model.get('hasValidated').addObject('newPassword');
        model.get('hasValidated').addObject('ne2Password');

        if (isBlank(newPassword) && isBlank(ne2Password)) {
            model.get('errors').add('newPassword', this.t('validation.Sorry, passwords can\'t be blank'));
            this.invalidate();
        } else {
            if (!validator.equals(newPassword, ne2Password || '')) {
                model.get('errors').add('ne2Password', this.t('validation.Your new passwords do not match'));
                this.invalidate();
            }

            this.passwordValidation(model, newPassword, 'newPassword');
        }
    },

    ownPasswordChange(model) {
        let oldPassword = model.get('password');

        this.passwordChange(model);

        // validation only marks the requested property as validated so we
        // have to add properties manually
        model.get('hasValidated').addObject('password');

        if (isBlank(oldPassword)) {
            model.get('errors').add('password', this.t('validation.Your current password is required to set a new one'));
            this.invalidate();
        }
    }
});
