import classic from 'ember-classic-decorator';
import { alias } from '@ember/object/computed';
import Controller from '@ember/controller';

@classic
export default class SiteController extends Controller {
    @alias('model')
    guid;
}
