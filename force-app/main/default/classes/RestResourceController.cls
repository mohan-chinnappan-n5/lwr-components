public with sharing class RestResourceController {

    // ref: for setting up Named Credentials
    // https://github.com/forcedotcom/b2b-commerce-on-lightning-quickstart/blob/master/examples/lwc/docs/NamedCredentials.md

    
    @AuraEnabled(cacheable=true)
    public static String fetchData(String resourcePath) {
        try {
            // Use Named Credential as the base URL
            String fullUrl = 'callout:SalesforceAPI' + resourcePath;  
            // "SalesforceAPI" is the Named Credential name

            HttpRequest req = new HttpRequest();
            req.setMethod('GET');
            
            // Named Credentials automatically handle authentication
            req.setEndpoint(fullUrl);
            
            Http h = new Http();
            HttpResponse resp = h.send(req);
            
            if (resp.getStatusCode() == 200) {
                return resp.getBody();
            } else {
                return '{"error": "Failed to fetch data", "status": "' + resp.getStatus() + '"}';
            }
        } catch (Exception e) {
            return '{"error": "' + e.getMessage() + '"}';
        }
    }
}