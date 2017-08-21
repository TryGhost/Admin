import Component from '@ember/component';
import boundOneWay from 'ghost-admin/utils/bound-one-way';
import moment from 'moment';
import {InvokeActionMixin} from 'ember-invoke-action';
import {formatDate} from 'ghost-admin/utils/date-formatting';
import {inject as injectService} from '@ember/service';

export default Component.extend(InvokeActionMixin, {
    tagName: 'span',
    classNames: 'gh-input-icon gh-icon-calendar',

    datetime: boundOneWay('value'),
    inputClass: null,
    inputId: null,
    inputName: null,
    settings: injectService(),

    didReceiveAttrs() {
        let datetime = this.get('datetime') || moment.utc();
        let blogTimezone = this.get('settings.activeTimezone');

        if (!this.get('update')) {
            throw new Error(`You must provide an \`update\` action to \`{{${this.templateName}}}\`.`);
        }

        this.set('datetime', formatDate(datetime || moment.utc(), blogTimezone));
    },

    focusOut() {
        let datetime = this.get('datetime');

        this.invokeAction('update', datetime);
    }
});
