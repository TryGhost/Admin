import {helper} from '@ember/component/helper';
import {htmlSafe} from '@ember/string';

export function integrationLogoStyle([integration]/*, hash*/) {
    if (integration.iconImage) {
        let style = `background-image:url(${integration.iconImage});background-size:45px;`;
        return htmlSafe(style);
    }
}

export default helper(integrationLogoStyle);
