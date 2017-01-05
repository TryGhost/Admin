import run from 'ember-runloop';
import $ from 'jquery';

export default function destroyApp(application) {
    // this is required to fix "second Pretender instance" warnings
    if (server) {
        server.shutdown();
    }

    // this is required because it gets injected during acceptance tests but
    // not removed meaning that the integration tests grab this element rather
    // than their rendered content
    $('.liquid-target-container').remove();

    run(application, 'destroy');
}
