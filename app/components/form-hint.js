import FormHint from 'ember-form-for/components/form-hint';
import computed from 'ember-computed';

export default FormHint.extend({
    showHint: computed('hint', 'hasErrors', function () {
        return this.get('hint') && !this.get('hasErrors');
    })
});
