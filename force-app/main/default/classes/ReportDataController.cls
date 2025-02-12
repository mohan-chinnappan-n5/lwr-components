public with sharing class ReportDataController {
    @AuraEnabled
    public static List<SObject> getReportData(String objectName, List<String> columns) {
        //System.debug('Fetching report data for object: ' + objectName);
        //System.debug('Columns: ' + columns);
        try {
            if (String.isEmpty(objectName)) {
                throw new IllegalArgumentException('❌ Object Name is empty or invalid.');
            }

            if (columns == null || columns.isEmpty()) {
                throw new IllegalArgumentException('❌ No columns specified for SOQL query.');
            }

            // Format column names properly
            List<String> formattedColumns = new List<String>();
            for (String col : columns) {
                if (col.contains('.')) {
                    // formattedColumns.add('"'+ col +'"'); // Wrap relationship fields
                } else {
                    formattedColumns.add(col);
                }
            }

            // Construct SOQL Query
            String soqlQuery = 'SELECT ' + String.join(columns, ', ') +
                               ' FROM ' + objectName + ' LIMIT 10';
            //System.debug('SOQL Query: ' + soqlQuery);

            // Execute SOQL Query
            List<SObject> results = Database.query(soqlQuery);
            //System.debug('Results: ' + results);
            return results;
        } catch (Exception e) {
            System.debug('Error fetching report data: ' + e.getMessage());
            return new List<SObject>(); // Return empty list on error
        }
    }
}