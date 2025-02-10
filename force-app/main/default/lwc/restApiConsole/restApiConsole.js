import { LightningElement, track } from 'lwc';

export default class RestApiConsole extends LightningElement {
    @track apiUrl = ''; // API URL
    @track httpMethod = 'GET'; // Default Method
    @track requestHeaders = [{ key: '', value: '' }]; // Headers
    @track queryParams = [{ key: '', value: '' }]; // Query Params
    @track requestBody = ''; // Request Body (JSON/XML)
    @track response = ''; // API Response
    @track responseTime = 0; // Time Taken for API Call
    @track statusCode = ''; // HTTP Status Code
    @track responseType = 'json'; // Default response view

    // HTTP Method Options
    get methodOptions() {
        return [
            { label: 'GET', value: 'GET' },
            { label: 'POST', value: 'POST' },
            { label: 'PUT', value: 'PUT' },
            { label: 'DELETE', value: 'DELETE' }
        ];
    }

    // Handle API URL Input
    handleUrlChange(event) {
        this.apiUrl = event.target.value;
    }

    // Handle HTTP Method Change
    handleMethodChange(event) {
        this.httpMethod = event.detail.value;
    }

    // Handle Request Body Change
    handleBodyChange(event) {
        this.requestBody = event.target.value;
    }

    // Add New Header
    addHeader() {
        this.requestHeaders = [...this.requestHeaders, { key: '', value: '' }];
    }

    // Update Header Values
    updateHeader(event) {
        const index = event.target.dataset.index;
        this.requestHeaders[index][event.target.name] = event.target.value;
    }

    // Add New Query Param
    addQueryParam() {
        this.queryParams = [...this.queryParams, { key: '', value: '' }];
    }

    // Update Query Param Values
    updateQueryParam(event) {
        const index = event.target.dataset.index;
        this.queryParams[index][event.target.name] = event.target.value;
    }

    // **🔥 Send API Request**
    async sendRequest() {
        if (!this.apiUrl) {
            alert('Please enter a valid API URL.');
            return;
        }

        const urlWithParams = this.buildUrlWithParams();
        const headers = this.buildHeaders();

        let options = {
            method: this.httpMethod,
            headers: headers
        };

        if (this.httpMethod !== 'GET' && this.requestBody) {
            options.body = this.requestBody;
        }

        const startTime = performance.now();
        try {
            const response = await fetch(urlWithParams, options);
            this.statusCode = response.status;
            this.responseTime = (performance.now() - startTime).toFixed(2);

            if (response.ok) {
                this.response = await response.json();
            } else {
                this.response = `Error: ${response.status} - ${response.statusText}`;
            }
        } catch (error) {
            this.response = `Network Error: ${error}`;
        }
    }

    // **🔗 Build URL with Query Params**
    buildUrlWithParams() {
        const params = this.queryParams
            .filter(param => param.key && param.value)
            .map(param => `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`)
            .join('&');

        return params ? `${this.apiUrl}?${params}` : this.apiUrl;
    }

    // **📌 Build Headers Object**
    buildHeaders() {
        let headers = {};
        this.requestHeaders.forEach(header => {
            if (header.key && header.value) {
                headers[header.key] = header.value;
            }
        });
        return headers;
    }

    // **🔥 Clear Response Data**
    clearResponse() {
        this.response = '';
        this.statusCode = '';
        this.responseTime = 0;
    }


    addHeader() {
        this.requestHeaders = [...this.requestHeaders, { key: `header_${Date.now()}`, value: '' }];
    }
    
    addQueryParam() {
        this.queryParams = [...this.queryParams, { key: `param_${Date.now()}`, value: '' }];
    }
}