import classic from 'ember-classic-decorator';
import { alias } from '@ember/object/computed';
import Controller from '@ember/controller';

@classic
export default class BillingController extends Controller {
    queryParams = ['action'];
    action = null;

    @alias('model')
    guid;
}
