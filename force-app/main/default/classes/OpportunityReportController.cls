public with sharing class OpportunityReportController {
    @AuraEnabled(cacheable=true)
    public static List<AggregateResult> getOpportunitiesByStage() {
        return [
            SELECT StageName, COUNT(Id) total
            FROM Opportunity
            WHERE IsClosed = FALSE
            GROUP BY StageName
        ];
    }
}