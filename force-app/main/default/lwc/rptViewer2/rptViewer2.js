import { LightningElement, track } from 'lwc';
import generateCSVFile from '@salesforce/apex/CsvExportController.generateCSVFile';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class RptViewer extends LightningElement {
    @track jsonContent = '';
    @track reportData = [];
    @track columns = [];
    @track aggregateData = [];
    @track aggregateColumns = [];

    @track showBalloon = false;
    @track balloonContent = '';

    // Pagination tracking
    @track pageSize = 10;  // Number of rows per page
    @track currentPage = 1; // Current page
    @track totalRecords = 0; // Total records in the dataset
    @track pagedReportData = []; // Data for the current page

    @track reportName = "";  // Report Name

    // search support
    @track searchTerm = ''; // Holds the search query

    // sorting
    @track sortBy;
    @track sortDirection = 'asc'; // Default to ascending

    // csv download
    @track showExportButton = false;
    @track downloadUrl = '';

    // Calculated value for total pages
    get totalPages() {
        return Math.ceil(this.totalRecords / this.pageSize);
    }

    // Disabled state for pagination buttons
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
                this.jsonContent = JSON.stringify(data, null, 2);
                // ✅ Show response in a balloon
                this.balloonContent = this.jsonContent;
                this.showBalloon = true;
                this.processReport(data);
            };
            reader.readAsText(file);
        }
    }

    closeBalloon() {
        this.showBalloon = false;
    }

    processReport(data) {
        this.reportName = data.attributes.reportName || 'Unknown Report';
        // Extract Column Headers
        const detailColumns = data.reportMetadata?.detailColumns || [];

        // Set Columns for DataTable
        this.columns = detailColumns.map(col => ({
            label: col,
            fieldName: col,
            type: 'text', // TODO: Add support for other types
            sortable: true
        }));

        // Extract Rows from factMap
        const factMap = data.factMap || {};
        const tableData = [];
        Object.keys(factMap).forEach(key => {
            const section = factMap[key];
            section.rows?.forEach(row => {
                const rowData = {};
                row.dataCells.forEach((cell, index) => {
                    rowData[detailColumns[index]] = cell.label || '-';
                });
                tableData.push(rowData);
            });
        });

        // Assign Data
        this.reportData = tableData.map((row, index) => ({ id: index, ...row }));
        this.totalRecords = this.reportData.length;
        this.filteredReportData = [...this.reportData]; // Initialize filtered data
        this.showExportButton = true;

        // Paginate the data
        this.updatePagedData();

        // Extract Aggregates
        const aggregateData = [];
        const aggregateHeaders = new Set(["Section"]);
        Object.keys(factMap).forEach(key => {
            const section = factMap[key];
            if (section.aggregates) {
                const aggRow = { Section: key };
                section.aggregates.forEach((agg, index) => {
                    const colName = `Aggregate ${index + 1}`;
                    aggRow[colName] = agg.label || "N/A";
                    aggregateHeaders.add(colName);
                });
                aggregateData.push(aggRow);
            }
        });

        // Set Aggregate Columns
        this.aggregateColumns = [...aggregateHeaders].map(col => ({
            label: col,
            fieldName: col,
            type: 'text'
        }));

        // Assign Aggregate Data
        this.aggregateData = aggregateData.map((row, index) => ({ id: index, ...row }));
    }

    // pagination
    updatePagedData() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.pagedReportData = this.filteredReportData.slice(startIndex, endIndex);
    }

    // Handle page change
    handlePageChange(event) {
        const direction = event.target.dataset.direction;
        if (direction === 'next' && (this.currentPage * this.pageSize) < this.totalRecords) {
            this.currentPage++;
        } else if (direction === 'prev' && this.currentPage > 1) {
            this.currentPage--;
        }
        this.updatePagedData();
    }

    // Handle search
    handleSearch(event) {
        this.searchTerm = event.target.value;
        if (this.searchTerm) {
            this.filteredReportData = this.reportData.filter(row => {
                return Object.values(row).some(value =>
                    String(value).toLowerCase().includes(this.searchTerm.toLowerCase())
                );
            });
        } else {
            this.filteredReportData = [...this.reportData];
        }
        this.totalRecords = this.filteredReportData.length;
        this.currentPage = 1;
        this.updatePagedData();
    }

    // Sorting Functionality
    handleSort(event) {
        const { fieldName, sortDirection } = event.detail;
        this.sortBy = fieldName;
        this.sortDirection = sortDirection;

        this.filteredReportData = [...this.filteredReportData].sort((a, b) => {
            let valueA = a[fieldName] ? a[fieldName].toLowerCase() : '';
            let valueB = b[fieldName] ? b[fieldName].toLowerCase() : '';

            return this.sortDirection === 'asc' ? 
                (valueA > valueB ? 1 : -1) : 
                (valueA < valueB ? 1 : -1);
        });

        this.updatePagedData();
    }

    // Export to CSV

    // Convert Data to CSV Format
    generateCSV() {
        if (!this.reportData || this.reportData.length === 0) {
            this.showToast('Error', 'No data available for export.', 'error');
            return null;
        }

        let csvContent = '';
        const columnHeaders = this.columns.map(col => col.label).join(',');
        csvContent += columnHeaders + '\n';

        this.reportData.forEach(row => {
            let rowData = this.columns.map(col => row[col.fieldName] || '').join(',');
            csvContent += rowData + '\n';
        });

        return btoa(csvContent); // Encode CSV data as base64
    }

    // Export Data and Store in Salesforce
    handleExportCSV() {
        const csvData = this.generateCSV();
        if (!csvData) return;

        const fileName = 'ReportData.csv';

        generateCSVFile({ csvData, fileName })
            .then(fileUrl => {
                this.downloadUrl = fileUrl; // Store file URL in a property
                this.showToast('Success', 'CSV exported successfully!', 'success');
            })
            .catch(error => {
                console.error('Error exporting CSV:', error);
                this.showToast('Error', 'Failed to export CSV.', 'error');
            });
    }

    // Show Toast Message
    showToast(title, message, variant) {
        const evt = new ShowToastEvent({ title, message, variant });
        this.dispatchEvent(evt);
    }
}