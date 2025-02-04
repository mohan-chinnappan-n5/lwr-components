import { LightningElement, wire, track } from 'lwc';
import getFilteredOpportunities from '@salesforce/apex/OpportunityReportController2.getFilteredOpportunities';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/ChartJS2';

export default class OpportunityDashboard2 extends LightningElement {
    chart;
    chartjsInitialized = false;
    @track chartData = [];
    @track selectedStage = 'All';
    @track startDate;
    @track endDate;
    chartInstances = {};

    stageOptions = [
        { label: 'All', value: 'All' },
        { label: 'Prospecting', value: 'Prospecting' },
        { label: 'Proposal', value: 'Proposal' },
        { label: 'Negotiation', value: 'Negotiation' },
        { label: 'Closed Won', value: 'Closed Won' },
        { label: 'Closed Lost', value: 'Closed Lost' }
    ];

    chartTypes = ['bar', 'pie', 'line'];

    @wire(getFilteredOpportunities, { stageName: '$selectedStage', startDate: '$startDate', endDate: '$endDate' })
    wiredOpportunities({ error, data }) {
        if (data) {
            this.chartData = data.map(item => ({
                stage: item.StageName,
                total: item.total
            }));
            this.updateCharts();
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
                this.initCharts();
            })
            .catch(error => {
                console.error('Error loading Chart.js', error);
            });
    }

    initCharts() {
        this.chartTypes.forEach(type => {
            const ctx = this.template.querySelector(`canvas[data-type="${type}"]`).getContext('2d');
            this.chartInstances[type] = new Chart(ctx, {
                type: type,
                data: { labels: [], datasets: [{ label: 'Opportunities by Stage', data: [], backgroundColor: this.getColors() }] },
                options: { responsive: true, plugins: { tooltip: { enabled: true } }, scales: { y: { beginAtZero: true } } }
            });
        });

        this.updateCharts();
    }

    updateCharts() {
        Object.keys(this.chartInstances).forEach(type => {
            const chart = this.chartInstances[type];
            if (chart && this.chartData.length > 0) {
                chart.data.labels = this.chartData.map(item => item.stage);
                chart.data.datasets[0].data = this.chartData.map(item => item.total);
                chart.update();
            }
        });
    }

    handleFilterChange(event) {
        const field = event.target.dataset.field;
        this[field] = event.target.value;
    }

    getColors() {
        return ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)'];
    }
}