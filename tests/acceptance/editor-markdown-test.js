/* jshint expr:true */
import {
    describe,
    it,
    beforeEach,
    afterEach
} from 'mocha';
import {expect} from 'chai';
import startApp from '../helpers/start-app';
import destroyApp from '../helpers/destroy-app';
import {authenticateSession} from 'ghost-admin/tests/helpers/ember-simple-auth';
import Ember from 'ember';
function editorRendered() {
    return Ember.Test.promise(function (resolve) {
        function checkEditor() {
            if(window.editor) {
                return resolve();
            } else {
                window.requestAnimationFrame(checkEditor);
            }
        }
        checkEditor();
    });
};

Ember.Test.registerAsyncHelper('inputSucceeded', function(app, result) {
     
      if(window.editor && window.editor.element && window.editor.element.innerHTML) {
          console.log('aaaaaaaa', 2);
         // return window.editor.element.innerHTML === result;
         return false;
      }
      console.log('aaaaaaaaaaa', 1)
      return false;
  
  });

Ember.Test.registerAsyncHelper('doInput', function(app, text) {
  return new Promise(function(resolve) {
    Ember.Test.adapter.asyncStart();

    window.editor.didRender(() => {
            //alert('input')
            //window.editor.unregisteralltexthandlers or something like that....
            // /Ember.run.schedule('afterRender', null, resolve);
            resolve();
            Ember.Test.adapter.asyncEnd();
        });
    window.editor._eventManager._textInputHandler.handle(text);
  });
});

describe.only('Acceptance: Editor', function() {
    let application;

    beforeEach(function() {
        application = startApp();
    });

    afterEach(function() {
        destroyApp(application);
    });

    describe('when logged in', function () {
        beforeEach(function () {
            let role = server.create('role', {name: 'Administrator'});
            server.create('user', {roles: [role]});
            server.loadFixtures('settings');

            return authenticateSession(application);
        });

        // it('the editor renders correctly', function () {
        //     server.createList('post', 1);

        //     visit('/editor/1');

        //     andThen(() => {
        //         expect(currentURL(), 'currentURL')
        //             .to.equal('/editor/1');
        //         expect(find('.surface').prop('contenteditable'), 'editor is editable')
        //             .to.equal('true');
        //         expect(window.editor)
        //             .to.be.an('object');
        //     });
        // });

        it('the editor accepts inputs', function () {
            server.createList('post', 1);

            visit('/editor/1');
            andThen(() => {
                return editorRendered();
            });
            
            andThen(() => {
                window.editor.element.focus(); // for some reason the editor doesn't work until it's focused when run in ghost-admin.
                //Ember.run(() => window.editor.insertText('abcdef'));
            });
            andThen(() => {
                return Ember.Test.promise(function (resolve) {
                    window.editor.didRender(() => {
                        if(window.editor.element.innerHTML === '<p>abcdef</p>') {
                            expect(window.editor.element.innerHTML).to.equal('<p>abcdef</p>');
                            return resolve();
                        }
                    
                    });
                    inputText(window.editor, 'abcdef');  
                });       
            });
        });
        it('1111shild accelt pamrkdown', function () {
            expect(1);
            server.createList('post', 1);
            visit('/editor/1');
            
            andThen(()=> {
                return editorRendered();
            });
            andThen(() => {
                window.editor.element.focus(); // for some reason the editor doesn't work until it's focused when run in ghost-admin.
            });
            andThen(() => {
                return Ember.Test.promise(function (resolve) {
                    window.editor.didRender(() => {
                        if(window.editor.element.innerHTML === '<p><strong>test</strong></p>') {
                            expect(window.editor.element.innerHTML).to.equal('<p><strong>test</strong></p>');
                            return resolve();
                        }
                    
                    });
                    inputText(window.editor, '**test**');  
                });       
            });
            // andThen(() => {
            //     inputSucceeded('<p><strong>test</strong></p>');
            // })
            // andThen(() => {
            //     expect(window.editor.element.innerHTML).to.equal('<p><strong>test</strong></p>');
            // }) ;    
        });
    });
});

let runLater = (cb) => window.requestAnimationFrame(cb);
function selectRangeWithEditor(editor, range) {
    editor.selectRange(range);
    return new Ember.RSVP.Promise(resolve => runLater(resolve));
}

function inputText(editor, text) {
    editor._eventManager._textInputHandler.handle(text);
}
















// Ember.Test.registerAsyncHelper('inputSucceeded', function(app, result) {

//   var waiter = function() {
//       //console.log(find('.surface'));
//       if(window.editor.element.innerHTML) {
//           return window.editor.element.innerHTML === result;
//       }
//       if(find('.surface').html()) {
//        return find('.surface').html() === result;
//       }

//       return false;
   
//   };

//   Ember.Test.registerWaiter(waiter);
//   var promise = app.testHelpers.wait();

//   promise.then(function() {
//     Ember.Test.unregisterWaiter(waiter);
//   });

//   // it will be resolved when the pending events have been processed
//   // (routing loads, ajax requests, run loops and waiters)
//   return promise;
// });


