import { LightningElement, track } from 'lwc';

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
                this.balloonContent = this.jsonContent
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
            type: 'text'
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
    // Update the paged data for current page
     updatePagedData() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.pagedReportData = this.reportData.slice(startIndex, endIndex);
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

}