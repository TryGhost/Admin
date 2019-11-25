import Component from '@ember/component';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default Component.extend({
    session: service(),
    store: service(),

    actions: {
        addYourself() {
            return this.add.perform();
        }
    },

    add: task(function* () {
        const member = this.store.createRecord('member', {
            email: this.get('session.user.email'),
            name: this.get('session.user.name')
        });

        try {
            return yield member.save();
        } catch (error) {
            if (error) {
                this.notifications.showAPIError(error, {key: 'member.save'});
            }
        }
    }).drop()
});
