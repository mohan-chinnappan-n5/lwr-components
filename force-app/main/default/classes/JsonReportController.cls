public with sharing class JsonReportController {
    @AuraEnabled(cacheable=true)
    public static List<SObject> getReportData(String objectApiName, List<String> fields, String filter, Integer recordLimit) {
        if (String.isEmpty(objectApiName) || fields.isEmpty()) {
            throw new AuraHandledException('Invalid request. Object API name and fields are required.');
        }
        System.debug('recordLimit: ' + recordLimit);

        String soqlQuery = 'SELECT ' + String.join(fields, ', ') + ' FROM ' + objectApiName;
        if (!String.isEmpty(filter)) {
            soqlQuery += ' WHERE ' + filter;
        }
        if (recordLimit > 0) {  // Use recordLimit instead of limit
            soqlQuery += ' LIMIT ' + recordLimit;
        }

        System.debug('Executing SOQL: ' + soqlQuery);
        return Database.query(soqlQuery);
    }
}   