import $ from 'jquery';
// This is used by the dropdown initializer to manage closing & toggling
import BodyEventListener from 'ghost-admin/mixins/body-event-listener';
import Evented from '@ember/object/evented';
import Service from '@ember/service';

export default Service.extend(Evented, BodyEventListener, {
    bodyClick(event) {
        let dropdownSelector = '.ember-basic-dropdown-trigger, .ember-basic-dropdown-content';

        if ($(event.target).closest(dropdownSelector).length <= 0) {
            this.closeDropdowns();
        }
    },

    closeDropdowns() {
        this.trigger('close');
    },

    toggleDropdown(dropdownName, dropdownButton) {
        this.trigger('toggle', {target: dropdownName, button: dropdownButton});
    }
});
