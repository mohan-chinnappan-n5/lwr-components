import { LightningElement, track } from "lwc";
import fetchData from "@salesforce/apex/RestResourceController.fetchData";

export default class Resty extends LightningElement {
    @track activeTab = "rest"; // Default tab
    @track resourceUrl = "/services/data/v60.0/analytics/reports";
    @track query = "SELECT Id, Name FROM Account";
    @track jsonResponse;
    @track tableData = [];
    @track columns;
    @track isLoading = false;

    @track showBalloon = false;
    @track balloonContent = '';

    @track useToolingApi = false; // Default to Standard API

    // Handle URL change for REST API
    handleUrlChange(event) {
        this.resourceUrl = event.target.value;
    }

    // Toggle Tooling API usage
    handleToolingApiToggle(event) {
        this.useToolingApi = event.target.checked;
    }

    // Handle SOQL query input (Textarea)
    handleQueryChange(event) {
        this.query = event.target.value;
    }

    // Convert Query to REST URL and Fetch Data (with Tooling API support)
    fetchQueryData() {
        // If Tooling API is enabled, use the Tooling endpoint for queries
        const apiPrefix = this.useToolingApi ? "/services/data/v60.0/tooling/query" : "/services/data/v60.0/query";
        this.resourceUrl = `${apiPrefix}?q=${encodeURIComponent(this.query)}`;
        this.fetchData();
    }

    // Fetch Data from API (REST or Tooling)
    fetchData() {
        this.isLoading = true;

        // If Tooling API is enabled, adjust the endpoint for REST API
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

                        // Extract columns from the first record and ignore "attributes"
                        if (this.tableData.length > 0) {
                            this.columns = Object.keys(this.tableData[0])
                                .filter(field => field !== "attributes") // Exclude "attributes"
                                .map((field) => ({
                                    label: field,
                                    fieldName: field,
                                    type: "text"
                                }));
                            this.showBalloon = false;
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

    closeBalloon() {
        this.showBalloon = false;
    }

    // Handle Tab Change
    handleTabChange(event) {
        this.activeTab = event.target.value;
    }
}