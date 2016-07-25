import InviteUserValidations from './invite-user';
import NavItemValidations from './nav-item';
import NewUserValidations from './new-user';
import PostValidations from './post';
import ResetValidations from './reset';
import SettingValidations from './setting';
import SetupValidations from './setup';
import SigninValidations from './signin';
import SlackValidations from './slack';
import SubscriberValidations from './subscriber';
import TagValidations from './tag';
import UserValidations from './user';

export default {
    inviteUser: InviteUserValidations,
    navItem: NavItemValidations,
    newUser: NewUserValidations,
    post: PostValidations,
    reset: ResetValidations,
    setting: SettingValidations,
    setup: SetupValidations,
    signin: SigninValidations,
    slack: SlackValidations,
    subscriber: SubscriberValidations,
    tag: TagValidations,
    user: UserValidations
};
