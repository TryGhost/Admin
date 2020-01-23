import EmberObject, {action} from '@ember/object';
import Service from '@ember/service';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';
import {isArray} from '@ember/array';
import {observes} from '@ember-decorators/object';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency-decorators';
import {tracked} from '@glimmer/tracking';

const CustomView = EmberObject.extend(ValidationEngine, {
    validationType: 'customView',

    name: '',
    route: '',
    filter: null,
    isNew: false,

    init() {
        this._super(...arguments);
        if (!this.filter) {
            this.filter = {};
        }
    },

    // convert to POJO so we don't store any client-specific objects in any
    // stringified JSON settings fields
    toJSON() {
        return {
            name: this.name,
            route: this.route,
            filter: this.filter
        };
    }
});

let isFilterEqual = function (filterA, filterB) {
    let aProps = Object.getOwnPropertyNames(filterA);
    let bProps = Object.getOwnPropertyNames(filterB);

    if (aProps.length !== bProps.length) {
        return false;
    }

    for (let i = 0; i < aProps.length; i++) {
        let key = aProps[i];
        if (filterA[key] !== filterB[key]) {
            return false;
        }
    }

    return true;
};

let isViewEqual = function (viewA, viewB) {
    return viewA.route === viewB.route
        && isFilterEqual(viewA.filter, viewB.filter);
};

export default class CustomViewsService extends Service {
    @service router;
    @service session;

    @tracked viewList = [];
    @tracked showFormModal = false;

    constructor() {
        super(...arguments);
        this.updateViewList();
    }

    // eslint-disable-next-line ghost/ember/no-observers
    @observes('session.user.accessibility')
    async updateViewList() {
        let user = await this.session.user;
        let userSettings = user.get('accessibility');

        if (!userSettings) {
            return this.viewList = [];
        }

        let views = JSON.parse(user.get('accessibility')).views;
        views = isArray(views) ? views : [];

        this.viewList = views.map((view) => {
            return CustomView.create(view);
        });
    }

    @action
    toggleFormModal() {
        this.showFormModal = !this.showFormModal;
    }

    @task
    *saveViewTask(view) {
        yield view.validate();

        // perform some ad-hoc validation of duplicate names because ValidationEngine doesn't support it
        let duplicateView = this.viewList.find((existingView) => {
            return existingView.route === view.route
                && existingView.name.trim().toLowerCase() === view.name.trim().toLowerCase()
                && !isFilterEqual(existingView.filter, view.filter);
        });
        if (duplicateView) {
            view.errors.add('name', 'Has already been used');
            view.hasValidated.pushObject('name');
            view.invalidate();
            return false;
        }

        // remove an older version of the view from our views list
        // - we don't allow editing the filter and route+filter combos are unique
        // - we create a new instance of a view from an existing one when editing to act as a "scratch" view
        let matchingView = this.viewList.find(existingView => isViewEqual(existingView, view));
        if (matchingView) {
            this.viewList.removeObject(matchingView);
        }

        this.viewList.push(view);

        // rebuild the "views" array in our user settings json string
        let userSettings = JSON.parse(this.session.user.get('accessibility'));
        userSettings.views = this.viewList.map(view => view.toJSON());
        this.session.user.set('accessibility', JSON.stringify(userSettings));

        let user = yield this.session.user;
        yield user.save();

        view.set('isNew', false);
        return view;
    }

    @task
    *deleteViewTask(view) {
        let matchingView = this.viewList.find(existingView => isViewEqual(existingView, view));
        if (matchingView) {
            this.viewList.removeObject(matchingView);

            let user = yield this.session.user;

            // rebuild the "views" array in our user settings json string
            let userSettings = JSON.parse(user.get('accessibility'));
            userSettings.views = this.viewList.map(view => view.toJSON());
            user.set('accessibility', JSON.stringify(userSettings));

            yield user.save();

            return true;
        }
    }

    get forPosts() {
        return this.viewList.filter(view => view.route === 'posts');
    }

    get forPages() {
        return this.viewList.filter(view => view.route === 'pages');
    }

    get forCurrentRoute() {
        return this.viewList.filter(view => view.route === this.router.currentRouteName);
    }

    get activeView() {
        if (this.forCurrentRoute.length > 0) {
            let {queryParams} = this.router.currentRoute;

            return this.forCurrentRoute.find(view => isFilterEqual(view.filter, queryParams));
        }

        return null;
    }

    newView() {
        return CustomView.create({
            isNew: true,
            route: this.router.currentRouteName,
            filter: this.router.currentRoute.queryParams
        });
    }

    editView() {
        return CustomView.create(this.activeView || this.newView());
    }
}
