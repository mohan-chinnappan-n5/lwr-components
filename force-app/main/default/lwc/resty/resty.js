import { LightningElement, track } from "lwc";
import fetchData from "@salesforce/apex/RestResourceController.fetchData";
import generateCSVFile from '@salesforce/apex/CsvExportController.generateCSVFile';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class Resty extends LightningElement {
    @track activeTab = "rest"; // Default tab
    @track resourceUrl = "/services/data/v60.0/analytics/reports";
    @track query = "SELECT Id, Name FROM Account";
    @track jsonResponse;
    @track tableData = [];
    @track filteredData = [];

    @track columns;
    @track isLoading = false;
    @track showBalloon = false;
    @track balloonContent = '';
    @track useToolingApi = false;

    // Pagination properties
    @track pageSize = 10;
    @track currentPage = 1;
    @track paginatedData = [];

    pageSizeOptions = [
        { label: "5", value: "5" },
        { label: "10", value: "10" },
        { label: "20", value: "20" }
    ];

    @track searchKey = "";

    // sorting
    @track sortBy;
    @track sortDirection = 'asc';

    // csv
      // csv download
      @track showExportButton = false;
      @track downloadUrl = '';
  
    

    get totalPages() {
        return Math.ceil(this.tableData.length / this.pageSize);
    }

    get disablePrevious() {
        return this.currentPage === 1;
    }

    get disableNext() {
        return this.currentPage >= this.totalPages;
    }

    handleUrlChange(event) {
        this.resourceUrl = event.target.value;
    }

    handleToolingApiToggle(event) {
        this.useToolingApi = event.target.checked;
    }

    handleQueryChange(event) {
        this.query = event.target.value;
    }

    fetchQueryData() {
        const apiPrefix = this.useToolingApi ? "/services/data/v60.0/tooling/query" : "/services/data/v60.0/query";
        this.resourceUrl = `${apiPrefix}?q=${encodeURIComponent(this.query)}`;
        this.fetchData();
    }

    fetchData() {
        this.isLoading = true;
        const apiPrefix = this.useToolingApi ? "/services/data/v60.0/tooling" : "/services/data/v60.0";
        let finalUrl = this.resourceUrl.startsWith(apiPrefix) ? this.resourceUrl : `${apiPrefix}${this.resourceUrl}`;

        fetchData({ resourcePath: finalUrl })
            .then((response) => {
                this.isLoading = false;
                this.jsonResponse = response;

                try {
                    let parsedData = JSON.parse(response);
                    if (parsedData.records) {
                        this.tableData = parsedData.records;
                        this.filteredData = [...this.tableData];


                    if (this.tableData.length > 0) {
                        this.showExportButton = true;
                            this.columns = Object.keys(this.tableData[0])
                                .filter(field => field !== "attributes")
                                .map((field) => {
                                    let sampleValue = this.tableData[0][field];
                                    let columnType = "text"; // Default type
                        
                                    if (typeof sampleValue === "number") {
                                        columnType = "number";
                                    } else if (typeof sampleValue === "boolean") {
                                        columnType = "boolean";
                                    } else if (field.toLowerCase().includes("date") || field.toLowerCase().includes("time")) {
                                        columnType = "date";
                                    }
                        
                                    return {
                                        label: field,
                                        fieldName: field,
                                        type: columnType,
                                        sortable: true
                                    };
                                });
                        
                            this.showBalloon = false;
                            this.currentPage = 1;
                            this.updatePaginatedData();
                        }   
                    } else {
                        this.columns = null;
                        this.showBalloon = true;
                        this.balloonContent = JSON.stringify(parsedData, null, 2);
                    }
                } catch (error) {
                    this.columns = null;
                    this.showBalloon = true;
                    this.balloonContent = "Invalid JSON response";
                }
            })
            .catch((error) => {
                this.isLoading = false;
                this.jsonResponse = JSON.stringify(error, null, 2);
                this.balloonContent = this.jsonResponse;
                this.columns = null;
                this.showBalloon = true;
            });
    }

    updatePaginatedData() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        // this.paginatedData = this.tableData.slice(start, end);
        this.paginatedData = this.filteredData.slice(start, end);

    }

    handlePreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePaginatedData();
        }
    }

    handleNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePaginatedData();
        }
    }

    handlePageSizeChange(event) {
        this.pageSize = parseInt(event.target.value, 10);
        this.currentPage = 1;
        this.updatePaginatedData();
    }

    closeBalloon() {
        this.showBalloon = false;
    }

    handleTabChange(event) {
        this.activeTab = event.target.value;
    }
    // search support
    handleSearch(event) {
        this.searchKey = event.target.value.toLowerCase();
        if (this.searchKey) {
            this.filteredData = this.tableData.filter((record) =>
                Object.values(record).some((val) =>
                    val && val.toString().toLowerCase().includes(this.searchKey)
                )
            );
        } else {
            this.filteredData = [...this.tableData];
        }
        this.currentPage = 1;
        this.updatePaginatedData();
    }


    // sorting
    handleSort(event) {
        const { fieldName, sortDirection } = event.detail;
        this.sortBy = fieldName;
        this.sortDirection = sortDirection;
        this.sortData(fieldName, sortDirection);
    }
    
    sortData(fieldName, sortDirection) {
        let sortedData = [...this.filteredData];
    
        sortedData.sort((a, b) => {
            let valA = a[fieldName] || '';
            let valB = b[fieldName] || '';
    
            if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }
    
            return sortDirection === 'asc'
                ? valA > valB ? 1 : -1
                : valA < valB ? 1 : -1;
        });
    
        this.filteredData = sortedData;
        this.updatePaginatedData();
    }




     // csv

      // ✅ Convert Data to CSV Format
      generateCSV() {
        this.reportData = [...this.tableData];
        // Check if reportData is empty
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

   

     // ✅ Export Data and Store in Salesforce
     handleExportCSV() {
        const csvData = this.generateCSV();
        if (!csvData) return;

        const fileName = 'ReportData.csv';

        generateCSVFile({ csvData, fileName })
            .then(fileUrl => {
                // window.open(fileUrl, '_blank'); // Open download link
                this.downloadUrl = fileUrl; // Store file URL in a property
                this.showToast('Success', 'CSV exported successfully!', 'success');


            })
            .catch(error => {
                console.error('Error exporting CSV:', error);
                this.showToast('Error', 'Failed to export CSV.', 'error');
            });
    }

    // ✅ Show Toast Message
    showToast(title, message, variant) {
        const evt = new ShowToastEvent({ title, message, variant });
        this.dispatchEvent(evt);
    }


}