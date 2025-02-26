({
    initializeCanvas: function (component) {
        var canvasApp = component.find("canvasApp").getElement();

        if (!canvasApp) {
            console.error("Canvas App not found!");
            return;
        }

        // Subscribe to Canvas messages
        Sfdc.canvas.client.subscribe(canvasApp, function (response) {
            if (response && response.context && response.context.user) {
                console.log("Canvas App Loaded:", response);
                
                // Update status and user info
                var statusElement = component.find("statusMessage").getElement();
                var userContextElement = component.find("userContext").getElement();
                
                statusElement.innerText = "Canvas App Loaded Successfully!";
                userContextElement.innerText = JSON.stringify(response.context.user, null, 2);
            } else {
                console.error("Error: Missing user context in Canvas response");
            }
        });
    }
});