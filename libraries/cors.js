/**
 * Modify every response header to allow CORS for partical tab.
 * Need refresh the tab after rules has been set.
 */
async function allowCors(tabId) {
  const rule = {
    id: 1,
    priority: 1,
    condition: {
      tabIds: [tabId],
      resourceTypes: ["image"],
    },
    action: {
      type: "modifyHeaders",
      responseHeaders: [
        {
          header: "Access-Control-Allow-Origin",
          operation: "set",
          value: "*"
        },
        {
          header: "Access-Control-Allow-Methods",
          operation: "set",
          value: "GET, PUT, POST, DELETE, HEAD, OPTIONS" // PATCH
        },
        {
          header: "Access-Control-Allow-Headers",
          operation: "set",
          value: "*"
        },
      ]
    }
  };

  return chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [rule.id],
    addRules: [rule]
  });
}
