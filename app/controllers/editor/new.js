import Controller from 'ember-controller';
import EditorControllerMixin from 'ghost-admin/mixins/editor-base-controller';

function K() {
    return this;
}

export default Controller.extend(EditorControllerMixin, {
    // Overriding autoSave on the base controller, as the new controller shouldn't be autosaving
    autoSave: K,
    actions: {
        /**
          * Redirect to editor after the first save
          */
        save(options) {
            return this._super(options).then((model) => {
                if (model.get('id')) {
                    this.replaceRoute('editor.edit', model);
                }
            });
        }
    }
});
