import { LightningElement, track, wire } from 'lwc';
import getReports from '@salesforce/apex/ReportsAndDashboardsController.getReports';
import getReportData from '@salesforce/apex/ReportsAndDashboardsController.getReportData';
import ChartJS from '@salesforce/resourceUrl/ChartJS2';
import { loadScript } from 'lightning/platformResourceLoader';

export default class ReportsDashboards extends LightningElement {
    @track reports = [];
    @track selectedReportId = '';
    @track reportData = [];
    @track columns = [];
    @track showTable = false;
    @track showChart = false;
    chartInstance;

    connectedCallback() {
        loadScript(this, ChartJS)
            .then(() => console.log('Chart.js Loaded'))
            .catch(error => console.error('Error loading Chart.js:', error));

        this.fetchReports();
    }

    fetchReports() {
        getReports()
            .then((result) => {
                alert(result);
                let parsedResult = JSON.parse(result);
                this.reports = parsedResult.records.map(report => ({
                    label: report.Name,
                    value: report.Id
                }));
            })
            .catch(error => {
                console.error('Error fetching reports:', error);
            });
    }

    handleReportChange(event) {
        this.selectedReportId = event.detail.value;
        this.fetchReportData();
    }

    fetchReportData() {
        if (!this.selectedReportId) return;

        getReportData({ reportId: this.selectedReportId })
            .then(result => {
                let parsedData = JSON.parse(result);

                // Process column headers
                this.columns = parsedData.reportMetadata.detailColumns.map(field => ({
                    label: field,
                    fieldName: field,
                    type: 'text'
                }));

                // Process rows
                this.reportData = parsedData.factMap['T!T'].rows.map(row => {
                    let record = {};
                    row.dataCells.forEach((cell, index) => {
                        record[this.columns[index].fieldName] = cell.label;
                    });
                    return record;
                });

                this.showTable = true;
                this.renderChart();
            })
            .catch(error => console.error('Error fetching report data:', error));
    }

    renderChart() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        let labels = this.reportData.map(row => row[this.columns[0].fieldName]);
        let dataValues = this.reportData.map(row => parseFloat(row[this.columns[1].fieldName]) || 0);

        const ctx = this.template.querySelector('canvas').getContext('2d');

        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Report Data',
                    data: dataValues,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: { responsive: true }
        });

        this.showChart = true;
    }
}