import RSVP from 'rsvp';
import injectService from 'ember-service/inject';
import {schedule} from 'ember-runloop';

import ModalComponent from 'ghost-admin/components/modals/base';
import validations from 'ghost-admin/utils/validations';

const {resolve} = RSVP;
const ValidationsMixin = validations('inviteUser');

export default ModalComponent.extend(ValidationsMixin, {
    classNames: 'modal-content invite-new-user',

    // Object properties
    email: '',
    role: null,

    roles: null,
    authorRole: null,
    submitting: false,

    validationType: 'inviteUser',

    notifications: injectService(),
    store: injectService(),

    init() {
        this._super(...arguments);

        // populate roles and set initial value for the dropdown
        schedule('afterRender', this, function () {
            this.get('store').query('role', {permissions: 'assign'}).then((roles) => {
                let authorRole = roles.findBy('name', 'Author');

                this.set('roles', roles);
                this.set('authorRole', authorRole);

                if (!this.get('role')) {
                    this.set('role', authorRole);
                }
            });
        });
    },

    willDestroyElement() {
        this._super(...arguments);

        this.get('changeset').rollback();
    },

    validate() {
        let changeset = this.get('changeset');

        this.set('submitting', true);

        return this.get('changeset').validate().then(() => {
            if (changeset.get('isInvalid')) {
                this.set('submitting', false);
                return resolve();
            }

            let email = changeset.get('email');

            return this.get('store').findAll('user', {reload: true}).then((result) => {
                let invitedUser = result.findBy('email', email);

                if (invitedUser) {
                    this.set('submitting', false);

                    if (invitedUser.get('status') === 'invited' || invitedUser.get('status') === 'invited-pending') {
                        changeset.addError('email', 'A user with that email address was already invited');
                    } else {
                        changeset.addError('email', 'A user with that email address already exists');
                    }
                }
            });
        });
    },

    actions: {
        setRole(role) {
            this.set('role', role);
        },

        confirm() {
            let changeset = this.get('changeset');
            let notifications = this.get('notifications');
            let newUser;

            this.validate().then(() => {
                if (changeset.get('isInvalid')) {
                    return;
                }

                changeset.execute();

                let {email, role} = this.getProperties('email', 'role');

                newUser = this.get('store').createRecord('user', {
                    email,
                    role,
                    status: 'invited'
                });

                newUser.save().then(() => {
                    let notificationText = `Invitation sent! (${email})`;

                    // If sending the invitation email fails, the API will still return a status of 201
                    // but the user's status in the response object will be 'invited-pending'.
                    if (newUser.get('status') === 'invited-pending') {
                        notifications.showAlert('Invitation email was not sent.  Please try resending.', {type: 'error', key: 'invite.send.failed'});
                    } else {
                        notifications.showNotification(notificationText, {key: 'invite.send.success'});
                    }
                }).catch((error) => {
                    newUser.deleteRecord();
                    notifications.showAPIError(error, {key: 'invite.send'});
                }).finally(() => {
                    changeset.rollback();
                    this.send('closeModal');
                });
            });
        }
    }
});
