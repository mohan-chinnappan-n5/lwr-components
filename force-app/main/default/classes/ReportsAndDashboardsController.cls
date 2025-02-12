public with sharing class ReportsAndDashboardsController {

    //ref: 
    // https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_callouts_named_credentials.htm
    // https://developer.salesforce.com/docs/platform/lwc/guide/data-api-calls-apex.html

    @AuraEnabled(cacheable=true)
    public static String getReports() {
        try {
            //String baseUrl = URL.getOrgDomainUrl().toExternalForm();
            //String apiUrl = baseUrl + '/services/data/v60.0/analytics/reports';


            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:SalesforceAPI/services/data/v60.0/analytics/reports');
            System.debug('API URL: ' + req.getEndpoint());
            req.setMethod('GET');

            String autho = 'Bearer {!$SalesforceAPI.OAuthToken}';
            req.setHeader('Authorization', autho);

            //req.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionId());
            req.setHeader('Content-Type', 'application/json');

            Http http = new Http();
            HttpResponse res = http.send(req);

            System.debug('Response: ' + res.getBody());

            if (res.getStatusCode() == 200) {
                return res.getBody();
            } else {
                return '{"error": "Failed to fetch reports. Status Code: ' + res.getStatusCode() + '"}';
            }
        } catch (Exception e) {
            return '{"error": "' + e.getMessage() + '"}';
        }
    }

    @AuraEnabled
    public static String getReportData(String reportId) {
        try {
            String baseUrl = URL.getOrgDomainUrl().toExternalForm();
            // String apiUrl = baseUrl + '/services/data/v60.0/analytics/reports/' + reportId;
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:SalesforceAPI/services/data/v60.0/analytics/reports/' + reportId);
            // req.setEndpoint(apiUrl);
            req.setMethod('GET');
            //req.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionId());
            req.setHeader('Content-Type', 'application/json');

            Http http = new Http();
            HttpResponse res = http.send(req);

            System.debug('Response: ' + res.getBody());


            if (res.getStatusCode() == 200) {
                return res.getBody();
            } else {
                return '{"error": "Failed to fetch report data. Status Code:333  ' + res.getStatusCode() + '"}';
            }
        } catch (Exception e) {
            return '{"error": "' + e.getMessage() + '"}';
        }
    }
}