import AdminRoute from '@tryghost/admin/routes/admin';

export default class MembersEmailRoute extends AdminRoute {
    beforeModel() {
        // Moved to newsletters
        return this.replaceWith('settings.newsletters');
    }
}
