public with sharing class ApiQueryController {
    
    @AuraEnabled(cacheable=true)
    public static String fetchData(String apiName) {
        try {
            Http http = new Http();
            HttpRequest request = new HttpRequest();

            // Construct API URL using getOrgDomainUrl()
            request.setEndpoint(URL.getOrgDomainUrl().toExternalForm() + '/services/data/v60.0/' + apiName);
            request.setMethod('GET');
            request.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionId());
            request.setHeader('Content-Type', 'application/json');

            // Send request
            HttpResponse response = http.send(request);
            
            if (response.getStatusCode() == 200) {
                return response.getBody();
            } else {
                return '{"error": "Failed to fetch data. Status Code: ' + response.getStatusCode() + '"}';
            }
        } catch (Exception e) {
            return '{"error": "' + e.getMessage() + '"}';
        }
    }
}