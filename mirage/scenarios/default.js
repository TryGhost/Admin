export default function (server) {
    // Seed your development database using your factories. This
    // data will not be loaded in your tests.

    // server.createList('contact', 10);

    server.createList('subscriber', 125);
    server.create('integration', {name: 'Demo'});

    server.createList('tag', 20);
    server.schema.tags.all().models.forEach((tag) => {
        if (Math.random() < 0.5) {
            let number = Math.ceil(Math.random() * 6);
            server.createList('tag', number, {parent: tag});
        }
    });
    let tagsWithParents = server.schema.tags.all().filter(tag => !!tag.parent);
    tagsWithParents.models.forEach((tag) => {
        if (Math.random() < 0.5) {
            let number = Math.ceil(Math.random() * 3);
            server.createList('tag', number, {parent: tag});
        }
    });
}
