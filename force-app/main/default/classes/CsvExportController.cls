public with sharing class CsvExportController {
    @AuraEnabled
    public static String generateCSVFile(String csvData, String fileName) {
        // to view: App Launcher > Files  
        try {
            // Create a new ContentVersion record
            ContentVersion contentVersion = new ContentVersion(
                Title = fileName,
                PathOnClient = fileName,
                VersionData = EncodingUtil.base64Decode(csvData),
                IsMajorVersion = true
            );
            insert contentVersion;

            // Retrieve the newly created ContentDocument ID
            Id contentDocumentId = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :contentVersion.Id LIMIT 1].ContentDocumentId;

            
             // Get the Salesforce instance URL dynamically
            String instanceUrl = Url.getOrgDomainUrl().toExternalForm();

            // Construct the full file download URL
            String fileUrl = instanceUrl + '/sfc/servlet.shepherd/document/download/' + contentDocumentId;

            return fileUrl; // Return full file download URL
        } catch (Exception e) {
            throw new AuraHandledException('Error creating CSV file: ' + e.getMessage());
        }
    }

   
}