import Model, {attr} from '@ember-data/model';
import ValidationEngine from '../mixins/validation-engine';

export default class Newsletter extends Model.extend(ValidationEngine) {
    validationType = 'newsletter';

    @attr name;
    @attr slug;
    @attr description;

    @attr senderName;
    @attr senderEmail;
    @attr({defaultValue: 'newsletter'}) senderReplyTo;

    @attr({defaultValue: 'active'}) status;
    @attr({defaultValue: ''}) recipientFilter;
    @attr({defaultValue: false}) subscribeOnSignup;
    @attr({defaultValue: 'members'}) visibility;
    @attr({defaultValue: 0}) sortOrder;

    // Design-related properties
    @attr headerImage;
    @attr({defaultValue: true}) showHeaderIcon;
    @attr({defaultValue: true}) showHeaderTitle;
    @attr({defaultValue: 'sans_serif'}) titleFontCategory;
    @attr({defaultValue: 'center'}) titleAlignment;
    @attr({defaultValue: true}) showFeatureImage;
    @attr({defaultValue: 'sans_serif'}) bodyFontCategory;
    @attr footerContent;
    @attr({defaultValue: true}) showBadge;

    // HACK - not a real model attribute but a workaround for Ember Data not
    //        exposing meta from save responses
    @attr _meta;
}
