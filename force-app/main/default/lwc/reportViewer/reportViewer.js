import { LightningElement, track } from 'lwc';
import getReportData from '@salesforce/apex/ReportDataController.getReportData';

export default class ReportViewer extends LightningElement {
    @track reportData = [];
    @track columns = [];
    @track columnsStr= ''
    @track reportName = '';
    @track showTable = false;
    @track errorMessage = '';

    @track showBalloon = false;
    @track balloonContent = '';


    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) {
            console.error('No file selected.');
            return;
        }
    
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsedJson = JSON.parse(JSON.stringify(JSON.parse(reader.result))); // Remove Proxy
    
                console.log('✅ JSON Parsed Successfully:', parsedJson);
    
                // Extract report name
                this.reportName = parsedJson?.attributes?.reportName || 'Unknown Report';
    
                // Extract object name (Example: "Opportunity")
                const objectName = parsedJson?.reportMetadata?.reportType || '';
                if (!objectName) {
                    this.errorMessage = '❌ Error: Object Name is missing in the JSON file.';
                    return;
                }
    
                // Extract column metadata
                const columnMetadata = parsedJson?.reportExtendedMetadata?.detailColumnInfo || {};
    
                // 🔹 Extract `fullyQualifiedName` fields
                const detailColumns = Object.values(columnMetadata).map(field => field.fullyQualifiedName);
    
                // 🔹 Extract column labels & types for the datatable
                this.columns = Object.values(columnMetadata).map(field => ({
                    label: field.label,
                    fieldName: field.fullyQualifiedName,
                    type: field.dataType === 'currency' ? 'currency' :
                          field.dataType === 'date' ? 'date' : 'text'
                }));

                this.columnsStr = JSON.stringify(this.columns, null,2);
    
    
                // Fetch report data using Apex SOQL
                this.fetchReportData(objectName.type, detailColumns);
            } catch (error) {
                console.error('❌ JSON Parsing Error:', error);
                this.errorMessage = 'Invalid JSON file. Please upload a correctly formatted JSON file.';
            }
        };
    
        reader.readAsText(file);
    }

   

     fetchReportData(objectName, columnNames) {
        console.log('Fetching report data for object:', objectName, 'with columns:', columnNames);
        getReportData({ objectName, columns: columnNames })
            .then(result => {
                if (result && result.length > 0) {

                  
                
                    //this.reportData = result;
                    this.reportData = result;
                    this.showTable = true;

                    // ✅ Show response in a balloon
                    this.balloonContent = JSON.stringify(this.reportData, null, 2);
                    this.showBalloon = true;
                } else {
                    this.errorMessage = 'No records found.';
                }
            })
            .catch(error => {
                console.error('Error fetching report data:', error);
                this.errorMessage = 'Failed to fetch report data.';
            });
    }
}