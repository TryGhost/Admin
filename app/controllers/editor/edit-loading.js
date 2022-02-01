import classic from 'ember-classic-decorator';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

/* eslint-disable ghost/ember/alias-model-in-controller */
@classic
export default class EditLoadingController extends Controller {
    @service
    ui;
}
