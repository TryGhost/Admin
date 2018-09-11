import Component from '@ember/component';
import config from 'ghost-admin/config/environment';
import {inject as service} from '@ember/service';
import {task, timeout} from 'ember-concurrency';

export default Component.extend({
    ajax: service(),
    ghostPaths: service(),

    count: '',

    didInsertElement() {
        this.get('_poll').perform();
    },

    _poll: task(function* () {
        let url = this.get('ghostPaths.count');
        let pattern = /(-?\d+)(\d{3})/;

        try {
            let data = yield this.get('ajax').request(url);
            let count = data.count.toString();

            while (pattern.test(count)) {
                count = count.replace(pattern, '$1,$2');
            }

            this.set('count', count);

            if (config.environment !== 'test') {
                yield timeout(2000);
                this.get('_poll').perform();
            }
        } catch (e) {
            // no-op - we don't want to create noise for a failed download count
        }
    })
});
