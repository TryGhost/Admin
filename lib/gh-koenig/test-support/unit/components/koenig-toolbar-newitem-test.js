/* jshint expr:true */
import {expect} from 'chai';
import {describe, it} from 'mocha';
import {setupComponentTest} from 'ember-mocha';

editor.range.head.section.renderNode._element.tagName
const editorShim = { 
    range: { 
        head: { 
            section: { 
                renderNode: {
                    _element: {
                        tagName: 'P'
                    }
                },
                isBlank: false
            } 
        } 
    }
};

describe('Unit: Component: koenig-toolbar-newitem', function () {
    setupComponentTest('koenig-toolbar-newitem', {
        unit: true,
        needs: [
            'component:koenig-toolbar-button'
        ]
    });

    it('renders', function () {

        let component = this.subject();
        component.editor = editorShim;
        expect(component._state).to.equal('preRender');

        // renders the component on the page
        this.render();
        expect(component._state).to.equal('inDOM');
    });
});
