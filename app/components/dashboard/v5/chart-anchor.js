import Component from '@glimmer/component';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';
import {tracked} from '@glimmer/tracking';
import moment from 'moment';

export default class ChartAnchor extends Component {
    @service dashboardStats;
    @tracked chartDisplay = 'total';

    @action
    loadCharts() {
        this.dashboardStats.loadMemberCountStats();
        this.dashboardStats.loadMrrStats();
    }

    @action
    changeChartDisplay(type) {
        this.chartDisplay = type;
        document.getElementById('gh-dashboard5-anchor-selection').classList.remove('is-hide');
        document.getElementById('gh-dashboard5-anchor-globaldate').classList.remove('is-show');
        document.getElementById('gh-dashboard5-anchor-total-normal').classList.remove('is-hide', 'is-fade');
        document.getElementById('gh-dashboard5-anchor-monthly-normal').classList.remove('is-hide', 'is-fade');
        document.getElementById('gh-dashboard5-anchor-paid-normal').classList.remove('is-hide', 'is-fade');
        document.getElementById('gh-dashboard5-anchor-total-tooltip').classList.remove('is-show');
        document.getElementById('gh-dashboard5-anchor-monthly-tooltip').classList.remove('is-show');
        document.getElementById('gh-dashboard5-anchor-paid-tooltip').classList.remove('is-show');
    }

    get chartShowingTotal() {
        return (this.chartDisplay === 'total');
    }

    get chartShowingPaid() {
        return (this.chartDisplay === 'paid');
    }

    get chartShowingMonthly() {
        return (this.chartDisplay === 'monthly');
    }

    get loading() {
        if (this.chartDisplay === 'total') {
            return this.dashboardStats.memberCountStats === null;
        } else if (this.chartDisplay === 'paid') {
            return this.dashboardStats.memberCountStats === null;
        } else if (this.chartDisplay === 'monthly') {
            return this.dashboardStats.mrrStats === null;
        }
        return true;
    }

    get totalMembers() {
        return this.dashboardStats.memberCounts?.total ?? 0;
    }

    get paidMembers() {
        return this.dashboardStats.memberCounts?.paid ?? 0;
    }

    get freeMembers() {
        return this.dashboardStats.memberCounts?.free ?? 0;
    }

    get currentMRR() {
        return this.dashboardStats.currentMRR ?? 0;
    }

    get hasTrends() {
        return this.dashboardStats.memberCounts !== null && this.dashboardStats.memberCountsTrend !== null;
    }

    get totalMembersTrend() {
        return this.calculatePercentage(this.dashboardStats.memberCountsTrend.total, this.dashboardStats.memberCounts.total);
    }

    get paidMembersTrend() {
        return this.calculatePercentage(this.dashboardStats.memberCountsTrend.paid, this.dashboardStats.memberCounts.paid);
    }

    get freeMembersTrend() {
        return this.calculatePercentage(this.dashboardStats.memberCountsTrend.free, this.dashboardStats.memberCounts.free);
    }

    get mrrTrend() {
        return this.calculatePercentage(this.dashboardStats.currentMRRTrend, this.dashboardStats.currentMRR);
    }

    get hasPaidTiers() {
        return this.dashboardStats.siteStatus?.hasPaidTiers;
    }

    get chartType() {
        return 'line';
    }

    get chartData() {
        let stats = [];
        let labels = [];
        let data = [];

        if (this.chartDisplay === 'total') {
            stats = this.dashboardStats.filledMemberCountStats;
            labels = stats.map(stat => stat.date);
            data = stats.map(stat => stat.paid + stat.free + stat.comped);
        }

        if (this.chartDisplay === 'paid') {
            stats = this.dashboardStats.filledMemberCountStats;
            labels = stats.map(stat => stat.date);
            data = stats.map(stat => stat.paid);
        }

        if (this.chartDisplay === 'monthly') {
            stats = this.dashboardStats.filledMrrStats;
            labels = stats.map(stat => stat.date);
            data = stats.map(stat => stat.mrr);
        }

        return {
            labels: labels,
            datasets: [{
                data: data,
                tension: 0,
                cubicInterpolationMode: 'monotone',
                fill: true,
                fillColor: '#F5FBFF',
                backgroundColor: '#F5FBFF',
                pointRadius: 0,
                pointHitRadius: 10,
                pointBorderColor: '#14b8ff',
                pointBackgroundColor: '#14b8ff',
                pointHoverBackgroundColor: '#14b8ff',
                pointHoverBorderColor: '#14b8ff',
                pointHoverRadius: 0,
                borderColor: '#14b8ff',
                borderJoinStyle: 'miter',
            }]
        };
    }

    get chartOptions() {
        let that = this;
        return {
            responsive: true,
            maintainAspectRatio: false,
            title: {
                display: false
            },
            legend: {
                display: false
            },
            layout: {
                padding: {
                    top: 20
                }
            },
            hover: {
                onHover: function (e) {
                    e.target.style.cursor = 'pointer';
                }
            },
            tooltips: {
                position: 'average',
                intersect: false,
                callbacks: {
                    label: function(tooltipItem, data) {

                        document.getElementById('gh-dashboard5-anchor-selection').classList.add('is-hide');
                        document.getElementById('gh-dashboard5-anchor-globaldate').classList.add('is-show');
                        document.getElementById('gh-dashboard5-anchor-globaldate').innerHTML = moment(tooltipItem.label).format('MMMM Do');

                        if (that.chartDisplay === 'total') {
                            document.querySelector('#gh-dashboard5-anchor-total-tooltip .gh-dashboard5-number').innerHTML = tooltipItem.value;
                            document.querySelector('#gh-dashboard5-anchor-total-tooltip .gh-dashboard5-info').innerHTML = 'Total members';
                            document.getElementById('gh-dashboard5-anchor-total-normal').classList.add('is-hide');
                            document.getElementById('gh-dashboard5-anchor-total-tooltip').classList.add('is-show');
                            document.getElementById('gh-dashboard5-anchor-paid-normal').classList.add('is-fade');
                            document.getElementById('gh-dashboard5-anchor-monthly-normal').classList.add('is-fade');
                        }

                        if (that.chartDisplay === 'paid') {
                            document.querySelector('#gh-dashboard5-anchor-paid-tooltip .gh-dashboard5-number').innerHTML = tooltipItem.value;
                            document.querySelector('#gh-dashboard5-anchor-paid-tooltip .gh-dashboard5-info').innerHTML = 'Paid members';
                            document.getElementById('gh-dashboard5-anchor-paid-normal').classList.add('is-hide');
                            document.getElementById('gh-dashboard5-anchor-paid-tooltip').classList.add('is-show');
                            document.getElementById('gh-dashboard5-anchor-total-normal').classList.add('is-fade');
                            document.getElementById('gh-dashboard5-anchor-monthly-normal').classList.add('is-fade');
                        }

                        if (that.chartDisplay === 'monthly') {
                            document.querySelector('#gh-dashboard5-anchor-monthly-tooltip .gh-dashboard5-number').innerHTML = '$' + tooltipItem.value;
                            document.querySelector('#gh-dashboard5-anchor-monthly-tooltip .gh-dashboard5-info').innerHTML = 'MRR';
                            document.getElementById('gh-dashboard5-anchor-monthly-normal').classList.add('is-hide');
                            document.getElementById('gh-dashboard5-anchor-monthly-tooltip').classList.add('is-show');
                            document.getElementById('gh-dashboard5-anchor-total-normal').classList.add('is-fade');
                            document.getElementById('gh-dashboard5-anchor-paid-normal').classList.add('is-fade');
                        }
                    }
                },
                custom : function(tooltipModel) {
                    tooltipModel.opacity = 0;

                    if (tooltipModel.body === undefined) {
                        document.getElementById('gh-dashboard5-anchor-selection').classList.remove('is-hide');
                        document.getElementById('gh-dashboard5-anchor-globaldate').classList.remove('is-show');
                        document.getElementById('gh-dashboard5-anchor-total-normal').classList.remove('is-hide', 'is-fade');
                        document.getElementById('gh-dashboard5-anchor-monthly-normal').classList.remove('is-hide', 'is-fade');
                        document.getElementById('gh-dashboard5-anchor-paid-normal').classList.remove('is-hide', 'is-fade');
                        document.getElementById('gh-dashboard5-anchor-total-tooltip').classList.remove('is-show');
                        document.getElementById('gh-dashboard5-anchor-monthly-tooltip').classList.remove('is-show');
                        document.getElementById('gh-dashboard5-anchor-paid-tooltip').classList.remove('is-show');
                        document.getElementById('gh-dashboard5-bar').classList.remove('is-show');
                    }
                    else {
                        document.getElementById('gh-dashboard5-bar').classList.add('is-show');
                        document.getElementById('gh-dashboard5-bar').style.left = (tooltipModel.x + 8) + 'px';
                    }
                    
                    return;
                }
            },
            scales: {
                yAxes: [{
                    gridLines: {
                        drawTicks: false,
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        display: false,
                        maxTicksLimit: 5,
                        fontColor: '#7C8B9A',
                        padding: 8,
                        precision: 0
                    },
                    display: true
                }],
                xAxes: [{
                    gridLines: {
                        drawTicks: false,
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        display: false,
                        maxTicksLimit: 5,
                        autoSkip: true,
                        maxRotation: 0,
                        minRotation: 0
                    },
                    type: 'time',
                    time: {
                        displayFormats: {
                            millisecond: 'MMM DD',
                            second: 'MMM DD',
                            minute: 'MMM DD',
                            hour: 'MMM DD',
                            day: 'MMM DD',
                            week: 'MMM DD',
                            month: 'MMM DD',
                            quarter: 'MMM DD',
                            year: 'MMM DD'
                        }
                    },
                    display: true
                }]
            }
        };
    }

    calculatePercentage(from, to) {
        if (from === 0) {
            if (to > 0) {
                return 100;
            }
            return 0;
        }

        return Math.round((to - from) / from * 100);
    }
}
