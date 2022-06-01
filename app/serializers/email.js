/* eslint-disable camelcase */
import ApplicationSerializer from '@tryghost/admin/serializers/application';

export default class EmailSerializer extends ApplicationSerializer {
    attrs = {
        createdAtUTC: {key: 'created_at'},
        updatedAtUTC: {key: 'updated_at'},
        submittedAtUTC: {key: 'submitted_at'}
    };
}
