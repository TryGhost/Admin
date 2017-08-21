/* eslint camelcase: [2, {properties: "never"}] */
import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import {belongsTo} from 'ember-data/relationships';
import {inject as injectService} from '@ember/service';

export default Model.extend({
    token: attr('string'),
    email: attr('string'),
    expires: attr('number'),
    createdAtUTC: attr('moment-utc'),
    createdBy: attr('number'),
    updatedAtUTC: attr('moment-utc'),
    updatedBy: attr('number'),
    status: attr('string'),
    role: belongsTo('role', {async: false}),

    ajax: injectService(),
    ghostPaths: injectService(),

    resend() {
        let fullInviteData = this.toJSON();

        let inviteData = {
            email: fullInviteData.email,
            role_id: fullInviteData.role
        };

        let inviteUrl = this.get('ghostPaths.url').api('invites');

        return this.get('ajax').post(inviteUrl, {
            data: JSON.stringify({invites: [inviteData]}),
            contentType: 'application/json'
        });
    }
});
