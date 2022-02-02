import classic from 'ember-classic-decorator';
import ApplicationSerializer from './application';

@classic
export default class Theme extends ApplicationSerializer {
    primaryKey = 'name';
}
