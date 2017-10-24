import EmberPowerSelectMultipleTrigger from 'ember-power-select/components/power-select-multiple/trigger';

export default EmberPowerSelectMultipleTrigger.extend({
    actions: {
        handleOptionMouseDown(event) {
            let action = this.get('extra.optionMouseDown');
            if (action) {
                return action(event);
            }
        },

        handleOptionTouchStart(event) {
            let action = this.get('extra.optionTouchStart');
            if (action) {
                return action(event);
            }
        }
    }
});
