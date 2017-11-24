import Component from '@ember/component';
import {alias} from '@ember/object/computed';
import {inject as service} from '@ember/service';

export default Component.extend({
    tagName: 'aside',
    classNames: 'gh-alerts',

    notifications: service(),

    messages: alias('notifications.alerts')
});
