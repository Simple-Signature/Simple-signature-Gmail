/* 
 * Copyright 2013, James Mortensen
 *
 * In case it isn't clear, this is licensed under the MIT License. So do with this what you please.
 *
 */
 var timestamp = null

function onRequest(request, sender, sendResponse) {
  // Show the page action for the tab that the sender (content script)
  // was on.
  chrome.pageAction.show(sender.tab.id);

  // Return nothing to let the connection be cleaned up.
  sendResponse({});
};

// Listen for the content script to send a message to the background page.
chrome.extension.onRequest.addListener(onRequest);

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if(message.message = "update simple signature's signature") {
      if(timestamp == null || (new Date()).getTime()-timestamp > 5000) {
        timestamp = (new Date()).getTime();
        chrome.storage.local.get(null, function(items) {
            if(items["simplesignature_URLSimpleSign"] == null) {
                items["simplesignature_URLSimpleSign"] = "http://simplesignature.meteor.com/";
                chrome.storage.local.set(items);
            }
            if(items["simplesignature_firm"] == null) {
              alert("vous n'avez pas configurez Simple Signature. Cliquez sur l'icône dans la barre d'adresse.");
              console.log(new Date())
              sendResponse({message:'notOk'});
              return;
            }
            console.info("getting signature from api");
            var xhr = new XMLHttpRequest();
            xhr.open("GET", items["simplesignature_URLSimpleSign"]+items["simplesignature_firm"]+"/"+items["simplesignature_service"], true);
            xhr.onreadystatechange = function() {
              console.log(xhr.responseText);
              if (xhr.readyState == 4) {
                if(xhr.status == 200) {
                  if(items["simplesignature_signs"] == xhr.responseText) return;                
                  items["simplesignature_signs"] = xhr.responseText.replace(/PATHAPPDATA/g, items["simplesignature_URLSimpleSign"]+"img/").replace(/VARIABLE_NAME/g, items["simplesignature_firstName"] + " " + items["simplesignature_lastName"]).replace(/VARIABLE_JOB/g, items["simplesignature_job"]).replace(/VARIABLE_PHONE/g, items["simplesignature_phone"]).replace(/VARIABLE_MAIL/g, items["simplesignature_mail"]);
                  chrome.storage.local.set(items);
                  sendResponse({message:'ok'});
                  chrome.runtime.sendMessage({message:"updated simple signature's signature"});
                } else if(xhr.status == 400) {
                  alert(xhr.responseText);
                  sendResponse({message:'notOk'});
                }
                else {
                  alert(xhr.responseText);
                  sendResponse({message:'notOk'});
                }
              }
            }
            xhr.send();        
        });
      }
    }
});