import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {and} from '@ember/object/computed';
import {resetQueryParams} from 'ghost-admin/helpers/reset-query-params';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

@classic
export default class ModalMembersLabelForm extends ModalComponent {
    @service
    router;

    @service
    notifications;

    model = null;
    showDeleteLabelModal = false;

    @and('model', 'model.label')
    label;

    willDestroyElement() {
        super.willDestroyElement(...arguments);
        this.label.errors.clear();
        this.label.rollbackAttributes();
    }

    @action
    toggleDeleteLabelModal() {
        this.label.rollbackAttributes();
        this.set('showDeleteLabelModal', true);
    }

    @action
    validate(property) {
        return this.label.validate({property});
    }

    @action
    confirm() {
        return this.saveTask.perform();
    }

    @task(function* () {
        let label = this.model && this.model.label;
        let availableLabels = (this.model && this.model.labels) || [];
        if (!label) {
            return false;
        }
        try {
            yield label.validate();

            let duplicateLabel = availableLabels.find((existingLabel) => {
                return existingLabel.name.trim().toLowerCase() === label.name.trim().toLowerCase()
                    && existingLabel.slug !== label.slug;
            });

            if (duplicateLabel) {
                label.errors.add('name', 'A label with the same name already exists');
                label.hasValidated.pushObject('name');
                // label.invalidate();

                return false;
            }

            let savedLabel = yield label.save();
            this.notifications.showNotification('Label saved');
            this.send('closeModal');
            return savedLabel;
        } catch (error) {
            if (error) {
                this.notifications.showAPIError(error, {key: 'label.save'});
            }
        }
    })
    saveTask;

    @task(function * () {
        let label = this.model && this.model.label;
        if (!label) {
            return false;
        }
        try {
            yield label.destroyRecord();
            let routeName = this.router.currentRouteName;
            this.notifications.showNotification('Label deleted');
            this.send('closeModal');
            this.router.transitionTo(routeName, {queryParams: resetQueryParams(routeName)});
        } catch (error) {
            if (error) {
                return this.notifications.showAPIError(error, {key: 'label.delete'});
            }
        }
    })
    deleteLabel;
}
