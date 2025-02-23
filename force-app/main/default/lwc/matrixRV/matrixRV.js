import { LightningElement, track } from 'lwc';

export default class MatrixRV extends LightningElement {
    @track matrixData = [];
    @track columnLabels = [];

    @track balloonContent = '';
    @track showBalloon = false;



    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const data = JSON.parse(reader.result);
                this.balloonContent = JSON.stringify(data, null, 2);
                this.showBalloon = true;
                this.parseeMatrixReport(data);
            };
            reader.readAsText(file);
        }
    }

    closeBalloon() {
        this.showBalloon = false;
    }


    parseeMatrixReport(reportData) {
        if (!reportData.factMap || !reportData.groupingsAcross || !reportData.groupingsDown) {
            return;
        }

        const factMap = reportData.factMap;
        const groupingsAcross = reportData.groupingsAcross.groupings;
        const groupingsDown = reportData.groupingsDown.groupings;

        // Extract labels
        // Build the column labels from the groupings across
        this.columnLabels = groupingsAcross.map(group => group.label);
        // Build the row labels from the groupings down
        let rowLabels = groupingsDown.map(group => group.label);

        // Build the matrix data
        let matrix = rowLabels.map((rowLabel, rowIndex) => {
            // For each row, build the data for each column
            let rowData = { rowLabel, values: [] };

            this.columnLabels.forEach((_, colIndex) => {
                let key = `${rowIndex}_${colIndex}!T`; // Example key format in factMap
                let value = factMap[key]?.aggregates?.[0]?.value || 0;

                rowData.values.push({
                    value,
                    cellClass: this.getCellClass(value) // Precompute class
                });
            });

            return rowData;
        });

        this.matrixData = matrix;
    }

    getCellClass(value) {
        if (value > 1000) return "high-value";
        if (value > 500) return "mid-value";
        return "low-value";
    }
}