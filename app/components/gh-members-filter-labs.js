import Component from '@glimmer/component';
import EmberObject, {action} from '@ember/object';
import nql from '@nexes/nql-lang';
import {A} from '@ember/array';
import {inject as service} from '@ember/service';
import {tracked} from '@glimmer/tracking';
export default class GhMembersFilterLabsComponent extends Component {
    @service session
    @service intl
    @tracked filters = A([
        EmberObject.create({
            id: `filter-0`,
            type: 'label',
            relation: 'is',
            value: [],
            relationOptions: {
                subscribed: [
                    {label: this.intl.t('Manual.JS.is'), name: 'is'},
                    {label: this.intl.t('Manual.JS.is_not'), name: 'is-not'}
                ],
                name: [
                    {label: this.intl.t('Manual.JS.is'), name: 'is'},
                    {label: this.intl.t('Manual.JS.is_not'), name: 'is-not'}
                ],
                email: [
                    {label: this.intl.t('Manual.JS.is'), name: 'is'},
                    {label: this.intl.t('Manual.JS.is_not'), name: 'is-not'}
                ],
                status: [
                    {label: this.intl.t('Manual.JS.is'), name: 'is'},
                    {label: this.intl.t('Manual.JS.is_not'), name: 'is-not'}
                ],
                'subscriptions.plan_interval': [
                    {label: this.intl.t('Manual.JS.is'), name: 'is'},
                    {label: this.intl.t('Manual.JS.is_not'), name: 'is-not'}
                ],
                'subscriptions.status': [
                    {label: this.intl.t('Manual.JS.is'), name: 'is'},
                    {label: this.intl.t('Manual.JS.is_not'), name: 'is-not'}
                ],
                label: [
                    {label: this.intl.t('Manual.JS.is'), name: 'is'},
                    {label: this.intl.t('Manual.JS.is_not'), name: 'is-not'}
                ],
                email_count: [
                    {label: this.intl.t('Manual.JS.is'), name: 'is'},
                    {label: this.intl.t('Manual.JS.is_greater_than'), name: 'is-greater'},
                    {label: this.intl.t('Manual.JS.is_less_than'), name: 'is-less'}
                ],
                email_opened_count: [
                    {label: this.intl.t('Manual.JS.is'), name: 'is'},
                    {label: this.intl.t('Manual.JS.is_greater_than'), name: 'is-greater'},
                    {label: this.intl.t('Manual.JS.is_less_than'), name: 'is-less'}
                ],
                email_open_rate: [
                    {label: this.intl.t('Manual.JS.is'), name: 'is'},
                    {label: this.intl.t('Manual.JS.is_greater_than'), name: 'is-greater'},
                    {label: this.intl.t('Manual.JS.is_less_than'), name: 'is-less'}
                ]
            }.label
        })
    ]);

    get totalFilters() {
        return this.filters?.length;
    }

    constructor(...args) {
        super(...args);
        this.availableFilterProperties = [
            // Basic
            {label: this.intl.t('Manual.JS.Label'), name: 'label', group: 'Basic'},
            {label: this.intl.t('Manual.JS.Newsletter_subscription'), name: 'subscribed', group: 'Basic'},

            // Member subscription
            {label: this.intl.t('Manual.JS.Member_status'), name: 'status', group: 'Subscription'},
            {label: this.intl.t('Manual.JS.Billing_period'), name: 'subscriptions.plan_interval', group: 'Subscription'},
            {label: this.intl.t('Manual.JS.Stripe_subscription_status'), name: 'subscriptions.status', group: 'Subscription'},

            // Emails
            {label: this.intl.t('Manual.JS.Emails_sent_all_time'), name: 'email_count', group: 'Email'},
            {label: this.intl.t('Manual.JS.Emails_opened_all_time'), name: 'email_opened_count', group: 'Email'},
            {label: this.intl.t('Manual.JS.Open_rate_all_time'), name: 'email_open_rate', group: 'Email'}
        ];
        this.availableFilterRelationsOptions = {
            subscribed: [
                {label: this.intl.t('Manual.JS.is'), name: 'is'},
                {label: this.intl.t('Manual.JS.is_not'), name: 'is-not'}
            ],
            name: [
                {label: this.intl.t('Manual.JS.is'), name: 'is'},
                {label: this.intl.t('Manual.JS.is_not'), name: 'is-not'}
            ],
            email: [
                {label: this.intl.t('Manual.JS.is'), name: 'is'},
                {label: this.intl.t('Manual.JS.is_not'), name: 'is-not'}
            ],
            status: [
                {label: this.intl.t('Manual.JS.is'), name: 'is'},
                {label: this.intl.t('Manual.JS.is_not'), name: 'is-not'}
            ],
            'subscriptions.plan_interval': [
                {label: this.intl.t('Manual.JS.is'), name: 'is'},
                {label: this.intl.t('Manual.JS.is_not'), name: 'is-not'}
            ],
            'subscriptions.status': [
                {label: this.intl.t('Manual.JS.is'), name: 'is'},
                {label: this.intl.t('Manual.JS.is_not'), name: 'is-not'}
            ],
            label: [
                {label: this.intl.t('Manual.JS.is'), name: 'is'},
                {label: this.intl.t('Manual.JS.is_not'), name: 'is-not'}
            ],
            email_count: [
                {label: this.intl.t('Manual.JS.is'), name: 'is'},
                {label: this.intl.t('Manual.JS.is_greater_than'), name: 'is-greater'},
                {label: this.intl.t('Manual.JS.is_less_than'), name: 'is-less'}
            ],
            email_opened_count: [
                {label: this.intl.t('Manual.JS.is'), name: 'is'},
                {label: this.intl.t('Manual.JS.is_greater_than'), name: 'is-greater'},
                {label: this.intl.t('Manual.JS.is_less_than'), name: 'is-less'}
            ],
            email_open_rate: [
                {label: this.intl.t('Manual.JS.is'), name: 'is'},
                {label: this.intl.t('Manual.JS.is_greater_than'), name: 'is-greater'},
                {label: this.intl.t('Manual.JS.is_less_than'), name: 'is-less'}
            ]
        };
        this.availableFilterValueOptions = {
            'subscriptions.plan_interval': [
                {label: this.intl.t('Manual.JS.Monthly'), name: 'month'},
                {label: this.intl.t('Manual.JS.Yearly'), name: 'year'}
            ],
            status: [
                {label: this.intl.t('Manual.JS.Paid'), name: 'paid'},
                {label: this.intl.t('Manual.JS.Free'), name: 'free'},
                {label: this.intl.t('Manual.JS.Complimentary'), name: 'comped'}
            ],
            subscribed: [
                {label: this.intl.t('Manual.JS.Subscribed'), name: 'true'},
                {label: this.intl.t('Manual.JS.Unsubscribed'), name: 'false'}
            ],
            'subscriptions.status': [
                {label: this.intl.t('Manual.JS.Active'), name: 'active'},
                {label: this.intl.t('Manual.JS.Trialing'), name: 'trialing'},
                {label: this.intl.t('Manual.JS.Canceled'), name: 'canceled'},
                {label: this.intl.t('Manual.JS.Unpaid'), name: 'unpaid'},
                {label: this.intl.t('Manual.JS.Past_Due'), name: 'past_due'},
                {label: this.intl.t('Manual.JS.Incomplete'), name: 'incomplete'},
                {label: this.intl.t('Manual.JS.Incomplete_Expired'), name: 'incomplete_expired'}
            ]
        };
        this.nextFilterId = 1;
        if (this.args.defaultFilterParam) {
            this.parseNqlFilter(this.args.defaultFilterParam);
        }
    }

    @action
    addFilter() {
        this.filters.pushObject(EmberObject.create({
            id: `filter-${this.nextFilterId}`,
            type: 'label',
            relation: 'is',
            value: [],
            relationOptions: this.availableFilterRelationsOptions.label
        }));
        this.nextFilterId = this.nextFilterId + 1;
        this.applySoftFilter();
    }

    @action
    onDropdownClose() {
        this.applyFilter();
    }

    generateNqlFilter(filters) {
        let query = '';
        filters.forEach((filter) => {
            if (filter.type === 'label' && filter.value?.length) {
                const relationStr = filter.relation === 'is-not' ? '-' : '';
                const filterValue = '[' + filter.value.join(',') + ']';
                query += `${filter.type}:${relationStr}${filterValue}+`;
            } else {
                const relationStr = this.getFilterRelationOperator(filter.relation);
                const filterValue = (typeof filter.value === 'string' && filter.value.includes(' ')) ? `'${filter.value}'` : filter.value;
                query += `${filter.type}:${relationStr}${filterValue}+`;
            }
        });
        return query.slice(0, -1);
    }

    parseNqlFilterKey(nqlFilter) {
        const keys = Object.keys(nqlFilter);
        const key = keys[0];
        const value = nqlFilter[key];
        const filterId = this.nextFilterId;
        if (typeof value === 'object') {
            if (value.$in !== undefined && key === 'label') {
                this.nextFilterId = this.nextFilterId + 1;
                return EmberObject.create({
                    id: `filter-${filterId}`,
                    type: key,
                    relation: 'is',
                    value: value.$in,
                    relationOptions: this.availableFilterRelationsOptions[key]
                });
            }
            if (value.$nin !== undefined && key === 'label') {
                this.nextFilterId = this.nextFilterId + 1;
                return EmberObject.create({
                    id: `filter-${filterId}`,
                    type: key,
                    relation: 'is-not',
                    value: value.$nin,
                    relationOptions: this.availableFilterRelationsOptions[key]
                });
            }
            if (value.$ne !== undefined) {
                this.nextFilterId = this.nextFilterId + 1;
                return EmberObject.create({
                    id: `filter-${filterId}`,
                    type: key,
                    relation: 'is-not',
                    value: value.$ne,
                    relationOptions: this.availableFilterRelationsOptions[key]
                });
            }
            if (value.$gt !== undefined) {
                this.nextFilterId = this.nextFilterId + 1;
                return EmberObject.create({
                    id: `filter-${filterId}`,
                    type: key,
                    relation: 'is-greater',
                    value: value.$gt ,
                    relationOptions: this.availableFilterRelationsOptions[key]
                });
            }

            if (value.$lt !== undefined) {
                this.nextFilterId = this.nextFilterId + 1;
                return EmberObject.create({
                    id: `filter-${filterId}`,
                    type: key,
                    relation: 'is-less',
                    value: value.$lt,
                    relationOptions: this.availableFilterRelationsOptions[key]
                });
            }
            return null;
        } else {
            this.nextFilterId = this.nextFilterId + 1;
            return EmberObject.create({
                id: `filter-${filterId}`,
                type: key,
                relation: 'is',
                value: value,
                relationOptions: this.availableFilterRelationsOptions[key]
            });
        }
    }

    parseNqlFilter(filterParam) {
        const validKeys = Object.keys(this.availableFilterRelationsOptions);
        const filters = nql.parse(filterParam);
        const filterKeys = Object.keys(filters);
        let filterData = [];
        if (filterKeys?.length === 1 && validKeys.includes(filterKeys[0])) {
            const filterObj = this.parseNqlFilterKey(filters);
            filterData = [filterObj];
        } else if (filters?.$and) {
            const andFilters = filters?.$and || [];
            filterData = andFilters.filter((nqlFilter) => {
                const _filterKeys = Object.keys(nqlFilter);
                if (_filterKeys?.length === 1 && validKeys.includes(_filterKeys[0])) {
                    return true;
                }
                return false;
            }).map((nqlFilter) => {
                return this.parseNqlFilterKey(nqlFilter);
            }).filter((nqlFilter) => {
                return !!nqlFilter;
            });
        }

        this.filters = A(filterData);
    }

    getFilterRelationOperator(relation) {
        if (relation === 'is-not') {
            return '-';
        } else if (relation === 'is-greater') {
            return '>';
        } else if (relation === 'is-less') {
            return '<';
        }
        return '';
    }

    @action
    deleteFilter(filterId, event) {
        event.stopPropagation();
        event.preventDefault();

        const filterToDelete = this.filters.findBy('id', filterId);
        if (this.filters.length === 1) {
            this.resetFilter();
        } else {
            this.filters.removeObject(filterToDelete);
            this.applySoftFilter();
        }
    }

    @action
    setFilterType(filterId, newType) {
        let defaultValue = this.availableFilterValueOptions[newType] ? this.availableFilterValueOptions[newType][0].name : '';
        if (newType === 'label' && !defaultValue) {
            defaultValue = [];
        }
        const filterToEdit = this.filters.findBy('id', filterId);
        filterToEdit?.setProperties({
            type: newType,
            relationOptions: this.availableFilterRelationsOptions[newType],
            value: defaultValue
        });
        if (newType !== 'label' && defaultValue) {
            this.applySoftFilter();
        }
    }

    @action
    setFilterRelation(filterId, newRelation) {
        const filterToEdit = this.filters.findBy('id', filterId);
        filterToEdit.set('relation', newRelation);
        this.applySoftFilter();
    }

    @action
    setFilterValue(filterType, filterId, filterValue) {
        const filterToEdit = this.filters.findBy('id', filterId);
        filterToEdit.set('value', filterValue);
        this.applySoftFilter();
    }

    @action
    applySoftFilter() {
        const validFilters = this.filters.filter((fil) => {
            if (fil.type === 'label') {
                return fil.value?.length;
            }
            return fil.value;
        });
        const query = this.generateNqlFilter(validFilters);
        this.args.onApplySoftFilter(query, validFilters);
    }

    @action
    applyFilter() {
        const validFilters = this.filters.filter((fil) => {
            if (fil.type === 'label') {
                return fil.value?.length;
            }
            return fil.value;
        });

        const query = this.generateNqlFilter(validFilters);
        this.args.onApplyFilter(query, validFilters);
    }

    @action
    resetFilter() {
        this.nextFilterId = 1;
        this.filters = A([
            EmberObject.create({
                id: `filter-0`,
                type: 'label',
                relation: 'is',
                value: [],
                relationOptions: this.availableFilterRelationsOptions.label
            })
        ]);
        this.args.onResetFilter();
    }
}
