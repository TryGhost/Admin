import Service from '@ember/service';
import {isArray} from '@ember/array';
import {inject as service} from '@ember/service';

export default class CustomViewsService extends Service {
    @service router;
    @service session;

    get userViews() {
        let views = JSON.parse(this.session.user.get('accessibility')).views;
        return isArray(views) ? views : [];
    }

    get forPosts() {
        return this.userViews.filter(view => view.route === 'posts');
    }

    get forPages() {
        return this.userViews.filter(view => view.route === 'pages');
    }

    get forCurrentRoute() {
        return this.userViews.filter(view => view.route === this.router.currentRouteName);
    }

    get activeView() {
        if (this.forCurrentRoute.length > 0) {
            let {queryParams} = this.router.currentRoute;

            return this.forCurrentRoute.find((view) => {
                let qpProps = Object.getOwnPropertyNames(queryParams);
                let vfProps = Object.getOwnPropertyNames(view.filter);

                if (qpProps.length !== vfProps.length) {
                    return false;
                }

                for (let i = 0; i < qpProps.length; i++) {
                    let key = qpProps[i];
                    if (view.filter[key] !== queryParams[key]) {
                        return false;
                    }
                }

                return true;
            });
        }

        return null;
    }
}
