public with sharing class AccountReportController {
    @AuraEnabled(cacheable=true)
    public static List<AggregateResult> getFilteredAccounts(String industry, String type, Date startDate, Date endDate) {
        String query = 'SELECT Industry, COUNT(Id) total FROM Account WHERE ';

        if (industry != 'All') {
            query += 'Industry = :industry AND ';
        }
        if (type != 'All') {
            query += 'Type = :type AND ';
        }
        query += 'CreatedDate >= :startDate AND CreatedDate <= :endDate GROUP BY Industry';

        return Database.query(query);
    }
}