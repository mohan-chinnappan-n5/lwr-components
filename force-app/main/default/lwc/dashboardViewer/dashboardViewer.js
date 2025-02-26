import { LightningElement, track } from 'lwc';

export default class DashboardViewer extends LightningElement {
    @track dashboardLoaded = false;
    @track dashboardName;
    @track dashboardDescription;
    @track reportTitle;
    @track columns = [];
    @track tableData = [];

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const jsonData = JSON.parse(reader.result);
                    this.processDashboardData(jsonData);
                } catch (error) {
                    console.error('Invalid JSON file', error);
                }
            };
            reader.readAsText(file);
        }
    }

    processDashboardData(data) {
        this.dashboardName = data.dashboardMetadata.name;
        this.dashboardDescription = data.dashboardMetadata.description;
        const report = data.dashboardMetadata.components[0];

        this.reportTitle = report.header;
        this.columns = report.properties.visualizationProperties.tableColumns;

        // Extract actual data from componentData
        const componentId = report.id;
        const component = data.componentData.find(c => c.componentId === componentId);

        if (component && component.reportResult && component.reportResult.factMap) {
            this.tableData = this.extractTableData(component.reportResult.factMap);
        } else {
            console.error('No report data found');
            this.tableData = [];
        }

        this.dashboardLoaded = true;
    }

    extractTableData(factMap) {
        let tableData = [];
    
        Object.values(factMap).forEach(entry => {
            if (entry.rows) {
                entry.rows.forEach((row, index) => {
                    let rowData = { id: index + 1 };
    
                    // Precompute static property keys for LWC template
                    this.columns.forEach(col => {
                        const colKey = col.column; // Column name as static key
                        rowData[colKey] = this.getCellValue(row, colKey);
                    });
    
                    tableData.push(rowData);
                });
            }
        });
    
        return tableData;
    }
    
    // Extracts the value for a given column
    getCellValue(row, columnName) {
        const cell = row.dataCells?.find(cell => cell.column === columnName);
        return cell ? cell.value : 'N/A'; // Provide default if data is missing
    }
}