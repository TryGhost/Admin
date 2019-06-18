import AuthenticatedRoute from 'ghost-admin/routes/authenticated';

export default AuthenticatedRoute.extend({
    buildRouteInfoMetadata() {
        return {
            titleToken: 'Posts',
            mainClasses: ['gh-main-primarybg']
        };
    }
});
