public with sharing class OpportunityReportController2 {
    @AuraEnabled(cacheable=true)
    public static List<AggregateResult> getFilteredOpportunities(String stageName, Date startDate, Date endDate) {
        String query = 'SELECT StageName, COUNT(Id) total FROM Opportunity WHERE ';
        
        if (stageName != 'All') {
            query += 'StageName = :stageName AND ';
        }
        query += 'CloseDate >= :startDate AND CloseDate <= :endDate GROUP BY StageName';
        
        return Database.query(query);
    }
}