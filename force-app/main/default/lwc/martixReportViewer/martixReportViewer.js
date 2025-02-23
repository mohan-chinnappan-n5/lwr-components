import { LightningElement, track } from 'lwc';
import generateCSVFile from '@salesforce/apex/CsvExportController.generateCSVFile';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class MatrixReportViewer extends LightningElement {
    @track reportName = '';
    @track balloonContent = '';
    @track showBalloon = false;
    @track matrixData = [];
    @track columns = [];
    @track factMapKeys = [];
    
    // Pagination & Sorting
    @track pageSize = 10;
    @track currentPage = 1;
    @track totalRecords = 0;
    @track pagedMatrixData = [];
    @track sortBy;
    @track sortDirection = 'asc';

    get totalPages() {
        return Math.ceil(this.totalRecords / this.pageSize);
    }

    get isPreviousDisabled() {
        return this.currentPage === 1;
    }

    get isNextDisabled() {
        return this.currentPage * this.pageSize >= this.totalRecords;
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const data = JSON.parse(reader.result);
                this.balloonContent = JSON.stringify(data, null, 2);
                this.showBalloon = true;
                this.processMatrixReport(data);
            };
            reader.readAsText(file);
        }
    }

    closeBalloon() {
        this.showBalloon = false;
    }

    processMatrixReport(data) {
        this.reportName = data.attributes.reportName || 'Unknown Report';
        
        const factMap = data.factMap || {};
        const matrixData = [];
        const factMapKeys = Object.keys(factMap);

        factMapKeys.forEach((key) => {
            const section = factMap[key];
            if (section.aggregates) {
                const row = { Section: key };
                section.aggregates.forEach((agg, index) => {
                    row[`Metric ${index + 1}`] = agg.label || 'N/A';
                });
                matrixData.push(row);
            }
        });

        this.matrixData = matrixData.map((row, index) => ({ id: index, ...row }));
        this.factMapKeys = factMapKeys;
        this.totalRecords = this.matrixData.length;

        // Create Columns Dynamically
        const aggregateHeaders = ["Section"];
        for (let i = 0; i < matrixData[0]?.["Metric 1"]?.length; i++) {
            aggregateHeaders.push(`Metric ${i + 1}`);
        }

        this.columns = aggregateHeaders.map(col => ({
            label: col,
            fieldName: col,
            type: 'text',
            sortable: true
        }));

        this.updatePagedData();
    }

    updatePagedData() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.pagedMatrixData = this.matrixData.slice(startIndex, endIndex);
    }

    handlePageChange(event) {
        const direction = event.target.dataset.direction;
        if (direction === 'next' && (this.currentPage * this.pageSize) < this.totalRecords) {
            this.currentPage++;
        } else if (direction === 'prev' && this.currentPage > 1) {
            this.currentPage--;
        }
        this.updatePagedData();
    }

    handleSort(event) {
        const { fieldName, sortDirection } = event.detail;
        this.sortBy = fieldName;
        this.sortDirection = sortDirection;

        this.matrixData = [...this.matrixData].sort((a, b) => {
            let valueA = a[fieldName] || '';
            let valueB = b[fieldName] || '';
            return this.sortDirection === 'asc' ? (valueA > valueB ? 1 : -1) : (valueA < valueB ? 1 : -1);
        });

        this.updatePagedData();
    }

    generateCSV() {
        if (!this.matrixData.length) {
            this.showToast('Error', 'No data available for export.', 'error');
            return null;
        }

        let csvContent = '';
        const columnHeaders = this.columns.map(col => col.label).join(',');
        csvContent += columnHeaders + '\n';

        this.matrixData.forEach(row => {
            let rowData = this.columns.map(col => row[col.fieldName] || '').join(',');
            csvContent += rowData + '\n';
        });

        return btoa(csvContent);
    }

    handleExportCSV() {
        const csvData = this.generateCSV();
        if (!csvData) return;

        const fileName = 'MatrixReport.csv';

        generateCSVFile({ csvData, fileName })
            .then(fileUrl => {
                this.downloadUrl = fileUrl;
                this.showToast('Success', 'CSV exported successfully!', 'success');
            })
            .catch(error => {
                console.error('Error exporting CSV:', error);
                this.showToast('Error', 'Failed to export CSV.', 'error');
            });
    }

    showToast(title, message, variant) {
        const evt = new ShowToastEvent({ title, message, variant });
        this.dispatchEvent(evt);
    }
}