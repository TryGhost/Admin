import ApplicationSerializer from '@tryghost/admin/serializers/application';

export default class NotificationSerializer extends ApplicationSerializer {
    attrs = {
        key: {key: 'location'}
    };
}
