import Component from '@glimmer/component';
import {inject as service} from '@ember/service';

export default class GhCustomViewsIndexLinkComponent extends Component {
    @service customViews;
    @service router;

    _lastIsActive = false;

    get isActive() {
        if (this.router.currentRouteName.match(/_loading$/)) {
            return this._lastIsActive;
        }

        let currentRouteName = this.router.currentRouteName.replace(/_loading$/, '');

        this._lastIsActive = currentRouteName === this.args.route
            && !this.customViews.activeView;

        return this._lastIsActive;
    }

    get resetQuery() {
        if (this.router.currentRouteName === this.args.route) {
            return this.args.query;
        }

        return undefined;
    }
}
