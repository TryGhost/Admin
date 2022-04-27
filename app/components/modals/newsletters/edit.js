import Component from '@glimmer/component';
import ConfirmCreateModal from './confirm-create';
import ConfirmNewsletterEmailModal from './confirm-newsletter-email';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';
import {tracked} from '@glimmer/tracking';

export default class EditNewsletterModal extends Component {
    @service modals;

    static modalOptions = {
        className: 'fullscreen-modal-full-overlay fullscreen-modal-portal-settings'
    };

    @tracked tab = 'settings';
    @tracked optInExisting = this.args.data.newsletter.isNew;

    willDestroy() {
        super.willDestroy(...arguments);
        this.args.data.newsletter.rollbackAttributes();
    }

    @action
    changeTab(tab) {
        this.tab = tab;
    }

    @action
    saveViaKeyboard(event, responder) {
        responder.stopPropagation();
        event.preventDefault();

        this.saveTask.perform();
    }

    @action
    setOptInExisting(value) {
        this.optInExisting = value;
    }

    @task
    *saveTask() {
        try {
            yield this.args.data.newsletter.validate({});

            const {optInExisting} = this;

            if (this.args.data.newsletter.isNew) {
                const shouldCreate = yield this.modals.open(ConfirmCreateModal, {
                    optInExisting,
                    newsletter: this.args.data.newsletter
                });

                if (!shouldCreate) {
                    // ensure task button returns to idle state
                    return 'canceled';
                }
            }

            const newEmail = this.args.data.newsletter.senderEmail;

            const result = yield this.args.data.newsletter.save({
                adapterOptions: {optInExisting}
            });

            if (result._meta?.sent_email_verification) {
                yield this.modals.open(ConfirmNewsletterEmailModal, {
                    newEmail,
                    currentEmail: this.args.data.newsletter.senderEmail
                });
            }

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
