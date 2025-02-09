import { LightningElement, track } from 'lwc';
import getReportData from '@salesforce/apex/JsonReportController.getReportData';
import ChartJS from '@salesforce/resourceUrl/ChartJS2';
import { loadScript } from 'lightning/platformResourceLoader';
import generateCSVFile from '@salesforce/apex/CsvExportController.generateCSVFile';


// import { NavigationMixin } from 'lightning/navigation';


export default class JsonReports extends LightningElement {
    @track reportData = [];
    @track filteredData = [];


    @track columns = [];
    @track charts = [];
    @track parsedJson = {};
    @track showTable = false;
    @track showCharts = false;
    chartInstances = [];

    @track searchKey = '';
    @track currentPage = 1;
    @track pageSize = 10; // Default page size
    @track totalPages = 1;


    @track pageSizeOptions = [
        { label: '5', value: '5' },
        { label: '10', value: '10' },
        { label: '20', value: '20' },
        { label: '50', value: '50' }
    ];

    @track sortBy;
    @track sortDirection = 'asc';

    @track showBalloon = false;
    @track balloonContent = '';
    @track showExportButton = true;


    connectedCallback() {
        // Load Chart.js dynamically
        loadScript(this, ChartJS)
            .then(() => {
                console.log('Chart.js Loaded Successfully.');
            })
            .catch(error => {
                console.error('Error loading Chart.js:', error);
            });
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) {
            console.error('No file selected.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            try {
                this.parsedJson = JSON.parse(reader.result);
                console.log('✅ JSON Parsed Successfully:', this.parsedJson);

                 // Show JSON in balloon
                this.balloonContent = JSON.stringify(this.parsedJson, null, 2);
                this.showBalloon = true;

                // Hide balloon after 12 seconds
                //setTimeout(() => { this.showBalloon = false; }, 12000);

                // Ensure JSON contains expected structure
                if (!this.parsedJson.report || !this.parsedJson.dashboard) {
                    console.error('❌ Invalid JSON structure.');
                    alert('Invalid JSON file structure. Ensure it has "report" and "dashboard" sections.');
                    return;
                }

                // Extract report details
                const { object, fields, filter, recordLimit } = this.parsedJson.report;
                if (!object || !fields || fields.length === 0) {
                    console.error('❌ Missing required report fields.');
                    alert('Report configuration is missing required fields.');
                    return;
                }

                console.log('📊 Fetching Report Data for:', object);
                this.fetchReportData(object, fields, filter, recordLimit);

                // Extract dashboard charts
                this.charts = this.parsedJson.dashboard.charts;
                this.showCharts = true;

                 // Enable CSV Export Button
                 this.showExportButton = this.parsedJson.report.allowExport;
            } catch (error) {
                console.error('❌ JSON Parsing Error:', error);
                alert('Invalid JSON file. Please upload a correctly formatted JSON file.');
            }
        };

        reader.onerror = () => {
            console.error('❌ Error reading file.');
            alert('Error reading file. Please try again.');
        };

        reader.readAsText(file);
    }

    fetchReportData(object, fields, filter, recordLimit) {
        console.log('🔍 Fetching Report Data:', object, fields, filter, recordLimit);
        getReportData({ objectApiName: object, fields, filter, recordLimit })
            .then(result => {
                if (!result || result.length === 0) {
                    console.warn('⚠️ No records found.');
                    alert('No records found for the given query.');
                    return;
                }

                console.log('✅ Report Data Fetched:', result);

                this.columns = fields.map(field => ({
                    label: field,
                    fieldName: field,
                    type: 'text',
                    sortable: true // Enable sorting
                }));

                this.reportData = result.map(record => ({
                    ...record,
                    Id: record.Id || Math.random().toString(36).substring(2, 15)
                }));

                this.filteredData = [...this.reportData];


                this.showTable = true;
                this.renderCharts();
            })
            .catch(error => {
                console.error('❌ Error fetching report data:', error);
                alert('Failed to fetch report data.');
            });
    }

    handleSearch(event) {
        this.searchKey = event.target.value.toLowerCase();
        this.filterData();
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


    renderCharts() {
        if (this.chartInstances.length > 0) {
            this.chartInstances.forEach(chart => chart.destroy());
            this.chartInstances = [];
        }
    
        // Wait for the DOM to update before querying for canvas elements
        requestAnimationFrame(() => {
            const canvases = this.template.querySelectorAll('canvas');
            console.log('🖼️ Canvas Elements:', canvases);
    
            if (canvases.length === 0) {
                console.error('❌ No canvas elements found. Charts will not render.');
                return;
            }
    
            this.charts.forEach((chartConfig, index) => {
                const canvas = canvases[index];
    
                if (!canvas) {
                    console.error(`❌ Chart Canvas #${index} not found.`);
                    return;
                }
    
                const ctx = canvas.getContext('2d');
                const labels = this.reportData.map(record => record[chartConfig.xAxis]);
                const dataValues = this.reportData.map(record => parseFloat(record[chartConfig.yAxis]) || 0);
    
                console.log(`📈 Rendering Chart #${index}:`, chartConfig.title);
    
                const chartInstance = new Chart(ctx, {
                    type: chartConfig.type,
                    data: {
                        labels,
                        datasets: [{
                            label: chartConfig.title,
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
    
                this.chartInstances.push(chartInstance);
            });
        });
    }



    handlePageSizeChange(event) {
        this.pageSize = parseInt(event.target.value, 10);
        this.currentPage = 1;
        this.updatePagination();
    }

    updatePagination() {
        this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        this.currentPage = Math.min(this.currentPage, this.totalPages) || 1;
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

    get isPreviousDisabled() {
        return this.currentPage === 1;
    }

    get isNextDisabled() {
        return this.currentPage >= this.totalPages;
    }

    handleSort(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData();
    }
    
    sortData() {
        let sortedData = [...this.filteredData];
        sortedData.sort((a, b) => {
            let valueA = a[this.sortBy] ? a[this.sortBy].toString().toLowerCase() : '';
            let valueB = b[this.sortBy] ? b[this.sortBy].toString().toLowerCase() : '';
    
            return this.sortDirection === 'asc'
                ? valueA.localeCompare(valueB, undefined, { numeric: true })
                : valueB.localeCompare(valueA, undefined, { numeric: true });
        });
    
        this.filteredData = sortedData;
        this.updatePagination();
    }

    closeBalloon() {
        this.showBalloon = false;
    }

    // csv
    exportToCSV() {
        if (!this.reportData || this.reportData.length === 0) {
            alert('No data available for export.');
            return;
        }
    
        let csvContent = this.columns.map(col => col.label).join(',') + '\n'; // CSV Headers
    
        this.reportData.forEach(record => {
            let row = this.columns.map(col => `"${record[col.fieldName] || ''}"`).join(',');
            csvContent += row + '\n';
        });
        // Convert CSV to Base64 (LWS-Safe)
        let csvBase64 = btoa(unescape(encodeURIComponent(csvContent)));

        generateCSVFile({ csvData: csvBase64, fileName: 'report_data.csv' })
        .then(fileUrl => {
            const linkElement = this.template.querySelector('.download-link');
            linkElement.href = fileUrl;
            linkElement.download = 'report_data.csv';
            linkElement.style.display = 'inline-block'; 
            
        })
        .catch(error => {
            console.error('Error generating CSV:', error);
            alert('Error exporting CSV. Please try again.');
        });
    }

}