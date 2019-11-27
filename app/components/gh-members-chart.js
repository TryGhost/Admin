import Component from '@ember/component';
import moment from 'moment';
import {computed} from '@ember/object';

export default Component.extend({
    members: null,

    subData: computed('members.@each', function () {
        let {members} = this;
        let startDate = moment().subtract(29, 'days');
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
            chartData: this.getChartData(members),
            totalSubs: totalSubs,
            totalSubsToday: totalSubsToday,
            totalSubsLastMonth: totalSubsLastMonth
        };
    }),

    getChartData(members) {
        let dateFormat = 'D MMM';
        let monthData = [];
        let dateLabel = [];
        let startDate = moment().subtract(29, 'days');
        for (let i = 0; i < 30; i++) {
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
                    text: 'Total members in last 30 days',
                    fontSize: 20
                },
                tooltip: {
                    displayColors: false
                },
                legend: {
                    /** https://www.chartjs.org/docs/latest/configuration/legend.html */
                },
                scales: {
                    xAxes: [{
                        labelString: 'Date'
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
