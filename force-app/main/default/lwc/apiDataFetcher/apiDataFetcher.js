import { LightningElement, track, wire } from 'lwc';
import fetchData from '@salesforce/apex/ApiQueryController.fetchData';

export default class ApiDataFetcher extends LightningElement {
    @track apiName = 'query/?q=SELECT+Id,Name+FROM+Account+LIMIT+10'; // Default SOQL Query
    @track jsonData = null;
    @track jsonDataString = '';
    @track tableData = [];
    @track columns = [];
    @track errorMessage = '';

    handleInputChange(event) {
        this.apiName = event.target.value;
    }

    handleFetchData() {
        if (!this.apiName) {
            this.errorMessage = 'Please enter a valid Salesforce API endpoint.';
            return;
        }

        fetchData({ apiName: this.apiName })
            .then((result) => {
                this.jsonData = JSON.parse(result);
                this.jsonDataString = JSON.stringify(this.jsonData, null, 2);
                console.log(this.jsonData);

                if (this.jsonData.records) {
                    this.tableData = this.jsonData.records;

                    // Dynamically extract columns from the first record
                    if (this.tableData.length > 0) {
                        this.columns = Object.keys(this.tableData[0]).map((field) => ({
                            label: field,
                            fieldName: field,
                            type: 'text'
                        }));
                    }
                } else {
                    this.errorMessage = 'No records found.';
                }
            })
            .catch((error) => {
                this.errorMessage = 'Error fetching data: ' + error.body.message;
            });
    }
}