import { LightningElement, track } from "lwc";
import fetchData from "@salesforce/apex/RestResourceController.fetchData";

export default class Resty extends LightningElement {
    @track resourceUrl = "/services/data/v60.0/query?q=SELECT+Id,Name+FROM+Account";
    @track jsonResponse;
    @track tableData = [];
    @track columns;
    @track isLoading = false;

    handleUrlChange(event) {
        this.resourceUrl = event.target.value;
    }

    fetchData() {
        this.isLoading = true;
        fetchData({ resourcePath: this.resourceUrl })
            .then((response) => {
                this.isLoading = false;
                this.jsonResponse = response;

                // Try to parse JSON
                let parsedData = JSON.parse(response);
                
                if (parsedData.records) {
                    this.tableData = parsedData.records;
                    
                    // Dynamically extract column names
                    if (this.tableData.length > 0) {
                        this.columns = Object.keys(this.tableData[0]).map((field) => ({
                            label: field,
                            fieldName: field,
                            type: "text"
                        }));
                    }
                } else {
                    this.columns = null;
                }
            })
            .catch((error) => {
                this.isLoading = false;
                this.jsonResponse = JSON.stringify(error, null, 2);
                this.columns = null;
            });
    }

     
}