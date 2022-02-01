import classic from 'ember-classic-decorator';
import { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import PostsLoadingController from './posts-loading';

/* eslint-disable ghost/ember/alias-model-in-controller */
@classic
export default class PagesLoadingController extends PostsLoadingController {
    @controller('pages')
    postsController;

    @service
    ui;
}
