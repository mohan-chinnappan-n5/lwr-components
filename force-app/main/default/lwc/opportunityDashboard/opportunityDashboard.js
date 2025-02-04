import { LightningElement, wire, track } from 'lwc';
import getOpportunitiesByStage from '@salesforce/apex/OpportunityReportController.getOpportunitiesByStage';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/ChartJS2';

export default class OpportunityDashboard extends LightningElement {
    chart;
    chartjsInitialized = false;
    @track chartData = [];
    @track selectedChartType = 'bar'; // Default chart type

    chartTypes = [
        { label: 'Bar Chart', value: 'bar' },
        { label: 'Pie Chart', value: 'pie' },
        { label: 'Line Chart', value: 'line' }
    ];

    @wire(getOpportunitiesByStage)
    wiredOpportunities({ error, data }) {
        if (data) {
            this.chartData = data.map(item => ({
                stage: item.StageName,
                total: item.total
            }));
            this.updateChart();
        } else if (error) {
            console.error('Error fetching data', error);
        }
    }

    renderedCallback() {
        if (this.chartjsInitialized) {
            return;
        }
        this.chartjsInitialized = true;

        loadScript(this, ChartJS)
            .then(() => {
                this.initChart();
            })
            .catch(error => {
                console.error('Error loading Chart.js', error);
            });
    }

    initChart() {
        const ctx = this.template.querySelector('canvas').getContext('2d');
        this.chart = new Chart(ctx, {
            type: this.selectedChartType,
            data: {
                labels: [],
                datasets: [{
                    label: 'Opportunities by Stage',
                    data: [],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)'
                    ]
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        this.updateChart();
    }

    updateChart() {
        if (this.chart && this.chartData.length > 0) {
            this.chart.data.labels = this.chartData.map(item => item.stage);
            this.chart.data.datasets[0].data = this.chartData.map(item => item.total);
            this.chart.update();
        }
    }

    handleChartTypeChange(event) {
        this.selectedChartType = event.target.value;
        this.chart.destroy(); // Destroy existing chart
        this.initChart(); // Reinitialize with new type
    }
}