import Component from 'ember-component';
import InViewportMixin from 'ember-in-viewport';

export default Component.extend(InViewportMixin, {

    onEnterViewport() {},

    didInsertElement() {
        this.set('viewportSpy', true);

        this._super(...arguments);
    },

    didEnterViewport() {
        return this.onEnterViewport();
    }

});
