import ApplicationAdapter from 'ghost-admin/adapters/application';
import SlugUrl from 'ghost-admin/mixins/slug-url';
import classic from 'ember-classic-decorator';

@classic
export default class Label extends ApplicationAdapter.extend(SlugUrl) {}
