import { LightningElement, track, wire } from 'lwc';
import getObjects from '@salesforce/apex/ReportController.getObjects';
import getFields from '@salesforce/apex/ReportController.getFields';
import getReportData from '@salesforce/apex/ReportController.getReportData';

export default class ReportingFramework extends LightningElement {
    @track objectOptions = [];
    @track selectedObject = '';
    @track fieldOptions = [];
    @track selectedFields = [];
    @track filterCondition = '';
    @track reportData = [];
    @track columns = [];
    @track showBalloon = false;
    @track balloonContent = '';

    // Fetch objects dynamically
    @wire(getObjects)
    wiredObjects({ error, data }) {
        if (data) {
            this.objectOptions = data.map(obj => ({ label: obj, value: obj }));
        } else if (error) {
            console.error('Error fetching objects:', error);
        }
    }

    // Fetch fields dynamically when an object is selected
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

                // Ensure ID is included for key field
                this.reportData = result.map(record => ({
                    ...record,
                    Id: record.Id || Math.random().toString(36).substring(2, 15) // Assign random key if Id is missing
                }));


                // Dynamically set columns
                this.columns = this.selectedFields.map(field => ({
                    label: field,
                    fieldName: field,
                    type: 'text'
                }));

                // Show Balloon with Records
                this.balloonContent = JSON.stringify(this.reportData, null, 2);

                this.showBalloon = true;

                // Hide balloon after 5 seconds
                setTimeout(() => {
                    this.showBalloon = false;
                }, 10000);
            })
            .catch(error => {
                console.error('Error fetching report data:', error);
            });
    }
}