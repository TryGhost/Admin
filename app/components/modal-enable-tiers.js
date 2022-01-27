import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

@classic
export default class ModalEnableTiers extends ModalComponent {
    @service
    feature;

    // Allowed actions
    confirm = () => {};

    @action
    confirm() {
        this.enableTiers.perform();
    }

    @(task(function* () {
        try {
            yield this.feature.set('multipleProducts', true);
        } finally {
            this.send('closeModal');
        }
    }).drop())
    enableTiers;
}
