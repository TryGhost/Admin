import Controller from '@ember/controller';
import {inject as injectService} from '@ember/service';
import {sort} from '@ember/object/computed';

export default Controller.extend({

    showInviteUserModal: false,

    activeUsers: null,
    suspendedUsers: null,
    invites: null,

    session: injectService(),

    inviteOrder: ['email'],
    sortedInvites: sort('invites', 'inviteOrder'),

    userOrder: ['name', 'email'],

    sortedActiveUsers: sort('activeUsers', 'userOrder'),
    sortedSuspendedUsers: sort('suspendedUsers', 'userOrder'),

    actions: {
        toggleInviteUserModal() {
            this.toggleProperty('showInviteUserModal');
        }
    }
});
