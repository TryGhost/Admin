import Component from '@glimmer/component';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';
import {tracked} from '@glimmer/tracking';

const STATUS_OPTIONS = [{
    name: 'All',
    value: 'total'
}, {
    name: 'Paid',
    value: 'paid'
}, {
    name: 'Free',
    value: 'free'
}];

export default class ChartEngagement extends Component {
    @service dashboardStats;

    @action
    loadCharts() {
        this.dashboardStats.lastSeenFilterStatus = this.status;
        this.dashboardStats.loadLastSeen();
        this.dashboardStats.loadMemberCountStats();
    }

    @tracked status = 'total';
    statusOptions = STATUS_OPTIONS;

    get selectedStatusOption() {
        return this.statusOptions.find(option => option.value === this.status);
    }

    @action 
    onSwitchStatus(selected) {
        this.status = selected.value;
        this.dashboardStats.lastSeenFilterStatus = this.status;
        this.dashboardStats.loadLastSeen();
    }

    get loading() {
        return this.dashboardStats.memberCounts === null
            || !this.dashboardStats.memberCounts[this.status]
            || this.dashboardStats.membersLastSeen30d === null 
            || this.dashboardStats.membersLastSeen7d === null;
    }
    
    get data30Days() {
        if (this.loading) {
            return '- %';
        }
        const total = this.dashboardStats.memberCounts[this.status];
        const part = this.dashboardStats.membersLastSeen30d;
        
        if (total <= 0) {
            return '- %';
        }

        const percentage = Math.round(part / total * 100);
        return `${percentage}%`;
    }

    get data7Days() {
        if (this.loading) {
            return '- %';
        }
        const total = this.dashboardStats.memberCounts[this.status];
        const part = this.dashboardStats.membersLastSeen7d;
        
        if (total <= 0) {
            return '- %';
        }

        const percentage = Math.round(part / total * 100);
        return `${percentage}%`;
    }
}
