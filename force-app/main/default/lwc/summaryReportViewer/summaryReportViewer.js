import { LightningElement, track } from 'lwc';

export default class SummaryReportViewer extends LightningElement {
    @track groupedData = [];
    @track errorMessage = '';

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                this.processReportData(data);
            } catch (error) {
                this.errorMessage = 'Invalid JSON file. Please upload a valid Salesforce report.';
            }
        };
        reader.readAsText(file);
    }

    processReportData(data) {
        this.errorMessage = '';
        const factMap = data.factMap || {};
        const columnNames = data.reportMetadata?.detailColumns || [];
        const aggregateNames = data.reportMetadata?.aggregates || [];

        let parsedData = [];
        Object.keys(factMap).forEach((key) => {
            const section = factMap[key];
            const groupName = key.replace("!T", ""); // Remove special characters
            const aggregates = (section.aggregates || []).reduce((acc, agg, index) => {
                acc[aggregateNames[index] || `Aggregate ${index + 1}`] = agg.value || 0;
                return acc;
            }, {});

            const rows = (section.rows || []).map((row, index) => {
                const rowData = { id: index };
                row.dataCells.forEach((cell, i) => {
                    rowData[columnNames[i] || `Column ${i + 1}`] = cell.label || "-";
                });
                return rowData;
            });

            parsedData.push({
                name: groupName,
                aggregates: JSON.stringify(aggregates, null, 2),
                rows: rows,
                columns: columnNames.map((col) => ({ label: col, fieldName: col, type: 'text' })),
                hasRows: rows.length > 0
            });
        });

        this.groupedData = parsedData;
    }
}