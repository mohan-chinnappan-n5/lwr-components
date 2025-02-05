public with sharing class ReportController {

    /**
     * Get all available Salesforce objects (Standard & Custom)
     */
    @AuraEnabled(cacheable=true)
    public static List<String> getObjects() {
        List<String> objectNames = new List<String>();
        try {
            Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();
            for (String objName : schemaMap.keySet()) {
                objectNames.add(objName);
            }
            return objectNames;
        } catch (Exception e) {
            System.debug('Error fetching objects: ' + e.getMessage());
            throw new AuraHandledException('Error fetching objects: ' + e.getMessage());
        }
    }

    /**
     * Get fields dynamically for a selected object
     * @param objectApiName - The API name of the selected object
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getFields(String objectApiName) {
        if (String.isEmpty(objectApiName)) {
            throw new AuraHandledException('Object API Name is required');
        }

        List<Map<String, String>> fieldList = new List<Map<String, String>>();
        try {
            Map<String, Schema.SObjectField> fieldMap = Schema.getGlobalDescribe().get(objectApiName).getDescribe().fields.getMap();

            for (String fieldName : fieldMap.keySet()) {
                Map<String, String> fieldDetails = new Map<String, String>();
                fieldDetails.put('label', fieldMap.get(fieldName).getDescribe().getLabel());
                fieldDetails.put('value', fieldName);
                fieldList.add(fieldDetails);
            }
        } catch (Exception e) {
            System.debug('Error fetching fields: ' + e.getMessage());
            throw new AuraHandledException('Error fetching fields: ' + e.getMessage());
        }

        return fieldList;
    }

    /**
     * Fetch report data dynamically based on selected object, fields, and optional filter
     * @param objectApiName - The API name of the selected object
     * @param fields - The list of fields to fetch
     * @param filter - (Optional) WHERE condition in SOQL format
     */
    @AuraEnabled(cacheable=true)
    public static List<sObject> getReportData(String objectApiName, List<String> fields, String filter) {
        if (String.isEmpty(objectApiName) || fields.isEmpty()) {
            throw new AuraHandledException('Invalid request. Object API name and fields are required.');
        }

        String soqlQuery = 'SELECT ' + String.join(fields, ',') + ' FROM ' + objectApiName;
        if (!String.isEmpty(filter)) {
            soqlQuery += ' WHERE ' + filter;
        }

        System.debug('SOQL Query: ' + soqlQuery);

        try {
            List<sObject> records = Database.query(soqlQuery);
            System.debug('Records Retrieved: ' + records);
            return records;
        } catch (Exception e) {
            System.debug('SOQL Error: ' + e.getMessage());
            throw new AuraHandledException('SOQL Error: ' + e.getMessage());
        }
    }
}