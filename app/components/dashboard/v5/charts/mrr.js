import Component from '@glimmer/component';
import moment from 'moment';
import {getSymbol} from 'ghost-admin/utils/currency';
import {ghPriceAmount} from '../../../../helpers/gh-price-amount';
import {inject as service} from '@ember/service';

const DATE_FORMAT = 'D MMM';

export default class Mrr extends Component {
    @service dashboardStats;
    @service feature;

    get loading() {
        return this.dashboardStats.mrrStats === null;
    }

    get currentMRR() {
        return this.dashboardStats.currentMRR ?? 0;
    }

    get mrrTrend() {
        return this.calculatePercentage(this.dashboardStats.currentMRRTrend, this.dashboardStats.currentMRR);
    }

    get hasTrends() {
        return this.dashboardStats.currentMRR !== null
            && this.dashboardStats.currentMRRTrend !== null;
    }

    get chartTitle() {
        return 'MRR';
    }

    get chartType() {
        return 'line';
    }

    get mrrCurrencySymbol() {
        if (this.dashboardStats.mrrStats === null) {
            return '';
        }
        
        const firstCurrency = this.dashboardStats.mrrStats[0] ? this.dashboardStats.mrrStats[0].currency : 'usd';
        return getSymbol(firstCurrency);
    }

    get chartData() {
        const stats = this.dashboardStats.filledMrrStats;
        const labels = stats.map(stat => stat.date);
        const data = stats.map(stat => stat.mrr);

        return {
            labels: labels,
            datasets: [{
                data: data,
                tension: 0,
                cubicInterpolationMode: 'monotone',
                fill: true,
                fillColor: 'rgba(142, 66, 255, 0.02)',
                backgroundColor: 'rgba(142, 66, 255, 0.02)',
                pointRadius: 0,
                pointHitRadius: 10,
                pointBorderColor: '#8E42FF',
                pointBackgroundColor: '#8E42FF',
                pointHoverBackgroundColor: '#8E42FF',
                pointHoverBorderColor: '#8E42FF',
                pointHoverRadius: 0,
                borderColor: '#8E42FF',
                borderJoinStyle: 'miter'
            }]
        };
    }

    get chartOptions() {
        let barColor = this.feature.nightShift ? 'rgba(200, 204, 217, 0.25)' : 'rgba(200, 204, 217, 0.65)';

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
                    top: 2,
                    bottom: 2
                }
            },
            hover: {
                onHover: function (e) {
                    e.target.style.cursor = 'pointer';
                }
            },
            tooltips: {
                intersect: false,
                mode: 'index',
                displayColors: false,
                backgroundColor: '#15171A',
                xPadding: 7,
                yPadding: 7,
                cornerRadius: 5,
                caretSize: 7,
                caretPadding: 5,
                bodyFontSize: 12.5,
                titleFontSize: 12,
                titleFontStyle: 'normal',
                titleFontColor: 'rgba(255, 255, 255, 0.7)',
                titleMarginBottom: 3,
                callbacks: {
                    label: (tooltipItems, data) => {
                        // Convert integer in cents to value in USD/other currency.
                        const valueText = ghPriceAmount(data.datasets[tooltipItems.datasetIndex].data[tooltipItems.index]);
                        return `MRR: ${this.mrrCurrencySymbol}${valueText}`;
                    },
                    title: (tooltipItems) => {
                        return moment(tooltipItems[0].xLabel).format(DATE_FORMAT);
                    }
                }
            },
            scales: {
                yAxes: [{
                    display: true,
                    gridLines: {
                        drawTicks: false,
                        display: false,
                        drawBorder: false,
                        color: 'transparent',
                        zeroLineColor: barColor,
                        zeroLineWidth: 1
                    },
                    ticks: {
                        display: false
                    }
                }],
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        align: 'start'
                    },
                    gridLines: {
                        color: barColor,
                        borderDash: [4,4],
                        display: false,
                        drawBorder: true,
                        drawTicks: false,
                        zeroLineWidth: 1,
                        zeroLineColor: barColor,
                        zeroLineBorderDash: [4,4]
                    },
                    ticks: {
                        display: false,
                        beginAtZero: true
                    }
                }]
            }
        };
    }

    get chartHeight() {
        return 90;
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
