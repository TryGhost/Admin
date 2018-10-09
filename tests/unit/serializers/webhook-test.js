import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupModelTest } from 'ember-mocha';

describe('Unit | Serializer | webhook', function() {
  setupModelTest('webhook', {
    // Specify the other units that are required for this test.
    needs: ['serializer:webhook']
  });

  // Replace this with your real tests.
  it('serializes records', function() {
    let record = this.subject();

    let serializedRecord = record.serialize();

    expect(serializedRecord).to.be.ok;
  });
});
