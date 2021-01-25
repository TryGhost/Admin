import Component from '@ember/component';
import ShortcutsMixin from 'ghost-admin/mixins/shortcuts';
import {match} from '@ember/object/computed';
import {inject as service} from '@ember/service';

export default Component.extend(ShortcutsMixin, {
    settings: service(),
    router: service(),

    tagName: 'nav',
    classNames: ['gh-nav'],

    isSettingsRoute: match('router.currentRouteName', /^settings/)
});
