import { LightningElement, track, wire } from 'lwc';
import getObjects from '@salesforce/apex/ReportController.getObjects';
import getFields from '@salesforce/apex/ReportController.getFields';
import getReportData from '@salesforce/apex/ReportController.getReportData';

// Import Chart.js from Static Resources
import ChartJS from '@salesforce/resourceUrl/ChartJS2';
import { loadScript } from 'lightning/platformResourceLoader';

export default class ReportingFramework extends LightningElement {
    @track objectOptions = [];
    @track selectedObject = '';
    @track fieldOptions = [];
    @track selectedFields = [];
    @track filterCondition = '';
    @track reportData = [];
    @track filteredData = [];
    @track columns = [];
    @track showBalloon = false;
    @track balloonContent = '';
    @track showTable = false;
    @track pageSize = 5;
    @track currentPage = 1;
    @track totalPages = 1;
    @track searchKey = '';
    @track showChart = false;
    @track chartType = 'bar';
    chartInstance;

    // Page size options
    @track pageSizeOptions = [
        { label: '5', value: '5' },
        { label: '10', value: '10' },
        { label: '20', value: '20' }
    ];

    // Chart type options
    @track chartOptions = [
        { label: 'Bar', value: 'bar' },
        { label: 'Line', value: 'line' },
        { label: 'Pie', value: 'pie' }
    ];

    isChartJsInitialized = false;

    connectedCallback() {
        loadScript(this, ChartJS)
            .then(() => {
                this.isChartJsInitialized = true;
            })
            .catch(error => {
                console.error('Error loading Chart.js:', error);
            });
    }

    @wire(getObjects)
    wiredObjects({ error, data }) {
        if (data) {
            this.objectOptions = data.map(obj => ({ label: obj, value: obj }));
        } else if (error) {
            console.error('Error fetching objects:', error);
        }
    }

    handleObjectChange(event) {
        this.selectedObject = event.detail.value;
        this.selectedFields = [];
        this.fieldOptions = [];

        getFields({ objectApiName: this.selectedObject })
            .then(result => {
                this.fieldOptions = result;
            })
            .catch(error => {
                console.error('Error fetching fields:', error);
            });
    }

    handleFieldsChange(event) {
        this.selectedFields = event.detail.value;
    }

    handleFilterChange(event) {
        this.filterCondition = event.target.value;
    }

    handlePageSizeChange(event) {
        this.pageSize = parseInt(event.target.value, 10);
        this.currentPage = 1;
        this.updatePagination();
    }

    handleSearch(event) {
        this.searchKey = event.target.value.toLowerCase();
        this.filterData();
    }

    extractFieldValue(record, fieldPath) {
        return fieldPath.split('.').reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : 'N/A'), record);
    }

    handleGenerateReport() {
        if (!this.selectedObject || this.selectedFields.length === 0) {
            return;
        }

        getReportData({ objectApiName: this.selectedObject, fields: this.selectedFields, filter: this.filterCondition })
            .then(result => {
                console.log('Report Data:', result);

                if (result.length === 0) {
                    console.warn('No records found for the query.');
                    this.showBalloon = false;
                    return;
                }

                this.reportData = result.map(record => ({
                    ...record,
                    Id: record.Id || Math.random().toString(36).substring(2, 15)
                }));

                this.columns = this.selectedFields.map(field => ({
                    label: field,
                    fieldName: field,
                    type: 'text'
                }));

                this.balloonContent = JSON.stringify(this.reportData, null, 2);
                this.showBalloon = true;

                setTimeout(() => {
                    this.showBalloon = false;
                }, 10000);

                this.filterData();
            })
            .catch(error => {
                console.error('Error fetching report data:', error);
            });
    }

    filterData() {
        if (this.searchKey) {
            this.filteredData = this.reportData.filter(record =>
                Object.values(record).some(value =>
                    String(value).toLowerCase().includes(this.searchKey)
                )
            );
        } else {
            this.filteredData = [...this.reportData];
        }
        this.updatePagination();
    }

    updatePagination() {
        this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        this.currentPage = this.totalPages > 0 ? Math.min(this.currentPage, this.totalPages) : 1;
    }

    get paginatedData() {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.filteredData.slice(start, start + this.pageSize);
    }

    handlePreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    handleNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }

    handleShowTable() {
        this.showTable = true;
    }

    handleExportCSV() {
        if (this.filteredData.length === 0) {
            alert('No data available for export.');
            return;
        }

        let csvContent = '';
        const columnHeaders = this.selectedFields.join(',');
        csvContent += columnHeaders + '\n';

        this.filteredData.forEach(record => {
            const row = this.selectedFields.map(field => `"${record[field] || ''}"`).join(',');
            csvContent += row + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `report_${this.selectedObject}.csv`;
        link.click();

        URL.revokeObjectURL(url);
    }

    handleShowChart() {
        this.showChart = true;
        this.renderChart();
    }

    handleChartTypeChange(event) {
        this.chartType = event.target.value;
        this.renderChart();
    }

    renderChart() {
        if (!this.isChartJsInitialized) {
            console.error('Chart.js is not loaded');
            return;
        }

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const ctx = this.template.querySelector('canvas').getContext('2d');
        const labels = this.filteredData.map(record => record[this.selectedFields[0]]);
        const dataValues = this.filteredData.map(record => parseFloat(record[this.selectedFields[1]]) || 0);

        this.chartInstance = new Chart(ctx, {
            type: this.chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: this.selectedFields[1],
                    data: dataValues,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    get isPreviousDisabled() {
        return this.currentPage === 1;
    }

    get isNextDisabled() {
        return this.currentPage >= this.totalPages;
    }
}