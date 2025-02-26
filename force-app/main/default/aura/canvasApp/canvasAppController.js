({
    doInit: function (component, event, helper) {
        // Wait for Canvas App to be available
        window.setTimeout($A.getCallback(function () {
            helper.initializeCanvas(component);
        }), 2000); // Delay to ensure the Canvas App is rendered
    }
});