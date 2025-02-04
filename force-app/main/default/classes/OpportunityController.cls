public with sharing class OpportunityController {
    @AuraEnabled(cacheable=true)
    public static List<Opportunity> getOpportunities() {
        return [SELECT Id, Name, StageName, Amount, CloseDate FROM Opportunity LIMIT 10];
    }
}