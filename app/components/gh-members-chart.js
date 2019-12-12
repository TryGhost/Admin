import Component from '@ember/component';
import moment from 'moment';
import {computed, get} from '@ember/object';

export default Component.extend({
    members: null,
    range: '30',
    selectedRange: computed('range', function () {
        const availableRange = this.get('availableRange');
        return availableRange.findBy('slug', this.get('range'));
    }),
    availableRange: computed(function () {
        return [
            {
                name: 'Last 10 days',
                slug: '10'
            },
            {
                name: 'Last 30 days',
                slug: '30'
            },
            {
                name: 'Last 60 days',
                slug: '60'
            },
            {
                name: 'Last 90 days',
                slug: '90'
            }
        ];
    }),

    subData: computed('members.@each', 'range', function () {
        let {members, range} = this;
        let rangeInDays = parseInt(range);
        let startDate = moment().subtract((rangeInDays - 1), 'days');
        let totalSubs = members.length || 0;
        let totalSubsLastMonth = members.filter((member) => {
            let isValid = moment(member.createdAtUTC).isSameOrAfter(startDate, 'day');
            return isValid;
        }).length;

        let totalSubsToday = members.filter((member) => {
            let isValid = moment(member.createdAtUTC).isSame(moment(), 'day');
            return isValid;
        }).length;
        return {
            chartData: this.getChartData(members, rangeInDays),
            totalSubs: totalSubs,
            totalSubsToday: totalSubsToday,
            totalSubsLastMonth: totalSubsLastMonth
        };
    }),

    actions: {
        changeDateRange(range) {
            this.set('range', get(range, 'slug'));
        }
    },

    getChartData(members, range) {
        let dateFormat = 'D MMM';
        let monthData = [];
        let dateLabel = [];
        let displayTitle = `Total members in last ${range} days`;
        let startDate = moment().subtract((range - 1), 'days');
        for (let i = 0; i < range; i++) {
            let m = moment(startDate).add(i, 'days');
            dateLabel.push(m.format(dateFormat));
            let membersTillDate = members.filter((member) => {
                let isValid = moment(member.createdAtUTC).isSameOrBefore(m, 'day');
                return isValid;
            }).length;
            monthData.push(membersTillDate);
        }
        return {
            data: {
                labels: dateLabel,
                datasets: [
                    {
                        /** Options: https://www.chartjs.org/docs/latest/charts/line.html#dataset-properties */
                        label: 'Total Members',
                        lineTension: 0,
                        data: monthData,
                        fill: false,
                        backgroundColor: 'rgba(62,176,239,.9)',
                        borderColor: 'rgba(62,176,239,.9)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                title: {
                    /** Options: https://www.chartjs.org/docs/latest/configuration/title.html */
                    display: true,
                    text: displayTitle,
                    fontSize: 20
                },
                tooltip: {
                    displayColors: false
                },
                legend: {
                    /** https://www.chartjs.org/docs/latest/configuration/legend.html */
                },
                scales: {
                    /**https://www.chartjs.org/docs/latest/axes/cartesian/linear.html */
                    xAxes: [{
                        labelString: 'Date',
                        ticks: {
                            maxTicksLimit: 15
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            precision: 0
                        }
                    }]
                }
            }
        };
    }
});
