import ApplicationSerializer from '@tryghost/admin/serializers/application';

export default class InviteSerializer extends ApplicationSerializer {
    attrs = {
        createdAtUTC: {key: 'created_at'},
        updatedAtUTC: {key: 'updated_at'}
    };
}
