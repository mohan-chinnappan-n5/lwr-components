import { LightningElement, wire, track } from 'lwc';
import getFilteredAccounts from '@salesforce/apex/AccountReportController.getFilteredAccounts';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/ChartJS2';

export default class AccountDashboard extends LightningElement {
    chartjsInitialized = false;
    @track chartData = [];
    @track selectedIndustry = 'All';
    @track selectedType = 'All';
    @track startDate;
    @track endDate;
    chartInstances = {};

    industryOptions = [
        { label: 'All', value: 'All' },
        { label: 'Finance', value: 'Finance' },
        { label: 'Healthcare', value: 'Healthcare' },
        { label: 'Technology', value: 'Technology' }
    ];

    typeOptions = [
        { label: 'All', value: 'All' },
        { label: 'Customer', value: 'Customer' },
        { label: 'Partner', value: 'Partner' },
        { label: 'Prospect', value: 'Prospect' }
    ];

    chartTypes = ['bar', 'pie', 'line'];

    @wire(getFilteredAccounts, { industry: '$selectedIndustry', type: '$selectedType', startDate: '$startDate', endDate: '$endDate' })
    wiredAccounts({ error, data }) {
        if (data) {
            this.chartData = data.map(item => ({
                industry: item.Industry,
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
                data: { labels: [], datasets: [{ label: 'Accounts by Industry', data: [], backgroundColor: this.getColors() }] },
                options: { responsive: true, plugins: { tooltip: { enabled: true } }, scales: { y: { beginAtZero: true } } }
            });
        });

        this.updateCharts();
    }

    updateCharts() {
        Object.keys(this.chartInstances).forEach(type => {
            const chart = this.chartInstances[type];
            if (chart && this.chartData.length > 0) {
                chart.data.labels = this.chartData.map(item => item.industry);
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

    exportToCSV() {
        let csvContent = 'Industry,Total\n';
        this.chartData.forEach(row => {
            csvContent += `${row.industry},${row.total}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'account_report.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}