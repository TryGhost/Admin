self.deprecationWorkflow = self.deprecationWorkflow || {};
self.deprecationWorkflow.config = {
    workflow: [
        // requires liquid-fire update to fix Ember.$ usage
        {handler: 'silence', matchId: 'ember-views.curly-components.jquery-element'},
        // requires Ember Data 3.10.0 which fixes the deprecation in errors.remove(attr)
        {handler: 'silence', matchId: 'computed-property.override'}
    ]
};
