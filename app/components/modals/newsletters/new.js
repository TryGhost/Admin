import Component from '@glimmer/component';
import ConfirmCreateModal from './confirm-create';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';
import {tracked} from '@glimmer/tracking';

export default class NewNewsletterModal extends Component {
    @service modals;

    @tracked optInExisting = this.args.data.newsletter.isNew;

    willDestroy() {
        super.willDestroy(...arguments);
        this.args.data.newsletter.rollbackAttributes();
    }

    @action
    onInput(property, event) {
        this.args.data.newsletter[property] = event.target.value;
    }

    @action
    saveViaKeyboard(event, responder) {
        responder.stopPropagation();
        event.preventDefault();

        this.saveTask.perform();
    }

    @action
    setOptInExisting(event) {
        this.optInExisting = event.target.value;
    }

    @action
    toggleOptInExisting() {
        this.optInExisting = !this.optInExisting;
    }

    @task
    *saveTask() {
        try {
            yield this.args.data.newsletter.validate({});

            const {optInExisting} = this;

            const shouldCreate = yield this.modals.open(ConfirmCreateModal, {
                optInExisting,
                newsletter: this.args.data.newsletter
            });

            if (!shouldCreate) {
                // ensure task button returns to idle state
                return 'canceled';
            }

            const result = yield this.args.data.newsletter.save({
                adapterOptions: {optInExisting}
            });

            this.args.data.afterSave?.(result);

            return result;
        } catch (e) {
            if (e === undefined) {
                // ensure task button shows failed state
                throw new Error('Validation failed');
            }

            throw e;
        }
    }
}
