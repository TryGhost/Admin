import Controller from 'ember-controller';
import RSVP from 'rsvp';
import computed, {alias} from 'ember-computed';
import injectService from 'ember-service/inject';
import injectController from 'ember-controller/inject';
import {htmlSafe} from 'ember-string';
import {later, cancel, schedule} from 'ember-runloop';
import {isEmberArray} from 'ember-array/utils';

const {all} = RSVP;

export default Controller.extend({
    notifications: injectService(),
    two: injectController('setup.two'),

    model: alias('two.model'),
    submitting: false,
    showErrors: false,

    buttonText: computed('model.changeset.users.[]', 'model.changeset.error.users.validation', 'hasUserErrors', function () {
        let userErrors = this.get('model.changeset.error.users.validation');
        let users = this.get('model.changeset.users').without('');
        let validNum = (users.length > 0 && users[0]) ? users.length : 0;
        let invalidNum, userCount;

        if (isEmberArray(userErrors)) {
            invalidNum = userErrors.length;
        } else if (userErrors && userErrors.match(/no users/i)) {
            return userErrors;
        } else if (userErrors && userErrors.length > 1) {
            invalidNum = 1;
        }

        if (invalidNum > 0 && this.get('hasUserErrors')) {
            userCount = invalidNum === 1 ? 'email address' : 'email addresses';
            return `${invalidNum} invalid ${userCount}`;
        }

        if (validNum > 0) {
            userCount = validNum === 1 ? 'user' : 'users';
            userCount = `${validNum} ${userCount}`;
        } else {
            userCount = 'some users';
        }

        return `Invite ${userCount}`;
    }),

    buttonClass: computed('hasUserErrors', 'model.changeset.users.length', function () {
        if (!this.get('hasUserErrors') && this.get('model.changeset.users').without('').length > 0) {
            return 'btn-green';
        } else {
            return 'btn-minor';
        }
    }),

    hasUserErrors: computed('model.changeset.error.users.validation.firstObject', 'model.changeset.hasValidated.[]', function () {
        let changeset = this.get('model.changeset');
        let errors = changeset.get('error.users.validation.firstObject');

        return changeset.get('hasValidated').contains('users') &&
            errors && errors.length > 0;
    }),

    authorRole: computed(function () {
        return this.store.findAll('role', {reload: true}).then((roles) => {
            return roles.findBy('name', 'Author');
        });
    }),

    _transitionAfterSubmission() {
        if (!this._hasTransitioned) {
            this._hasTransitioned = true;
            this.get('model').reset();
            this.transitionToRoute('posts.index');
        }
    },

    actions: {
        focusOut() {
            this.set('showErrors', false);
        },

        invite() {
            let changeset = this.get('model.changeset');

            if (changeset.get('users').length === 0) {
                changeset.addError('users', 'No users to add');
                this.toggleProperty('showErrors');
                return;
            }

            changeset.validate('users').then(() => {
                if (changeset.get('isInvalid')) {
                    return;
                }

                let ownerEmail = this.get('model.email');

                // filter out & uniqify
                changeset.prepare((changes) => {
                    let users = changes.users.filter((email) => {
                        return email.trim().length > 0;
                    }).uniq();

                    return {users};
                });

                changeset.clear('users');

                if (changeset.get('users').contains(ownerEmail)) {
                    changeset.addError('users', `${ownerEmail} is already in use`);
                    changeset.get('hasValidated').push('users');
                    this.toggleProperty('showErrors');
                    return;
                }

                changeset.execute();

                let users = this.get('model.users');
                let notifications = this.get('notifications');
                let submissionTimeout, invitationsString;

                if (users.length > 0) {
                    this.set('submitting', true);
                    this._hasTransitioned = false;

                    // wait for 4 seconds, otherwise transition anyway
                    submissionTimeout = later(this, function () {
                        this._transitionAfterSubmission();
                    }, 4000);

                    this.get('authorRole').then((authorRole) => {
                        all(users.map((email) => {
                            let newUser = this.store.createRecord('user', {
                                email,
                                status: 'invited',
                                role: authorRole
                            });

                            return newUser.save().then(() => {
                                return {
                                    email,
                                    success: newUser.get('status') === 'invited'
                                };
                            }).catch(() => {
                                return {
                                    email,
                                    success: false
                                };
                            });
                        })).then((invites) => {
                            let erroredEmails = [];
                            let successCount = 0;
                            let message;

                            cancel(submissionTimeout);

                            invites.forEach((invite) => {
                                if (invite.success) {
                                    successCount++;
                                } else {
                                    erroredEmails.push(invite.email);
                                }
                            });

                            if (erroredEmails.length > 0) {
                                invitationsString = erroredEmails.length > 1 ? 'invitations: ' : 'invitation ';
                                message = `Failed to send ${erroredEmails.length} ${invitationsString}`;
                                message += erroredEmails.join(', ');
                                message += '. Please check your email configuration, see <a href="http://support.ghost.org/mail" target="_blank">http://support.ghost.org/mail</a> for instructions';

                                message = htmlSafe(message);
                                notifications.showAlert(message, {type: 'error', delayed: successCount > 0, key: 'setup.send-invitations.failed'});
                            }

                            if (successCount > 0) {
                                // pluralize
                                invitationsString = successCount > 1 ? 'invitations' : 'invitation';
                                notifications.showAlert(`${successCount} ${invitationsString} sent!`, {type: 'success', delayed: true, key: 'setup.send-invitations.success'});
                            }

                            this.set('submitting', false);

                            schedule('actions', this, function () {
                                this.send('loadServerNotifications');
                                this._transitionAfterSubmission();
                            });
                        });
                    });
                } else if (users.length === 0) {
                    changeset.addError('users', 'No users to invite');
                }
            });
        },

        skipInvite() {
            this.send('loadServerNotifications');
            this.transitionToRoute('posts.index');
        }
    }
});
