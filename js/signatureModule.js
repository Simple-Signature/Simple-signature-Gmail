var regexMail = new RegExp("[a-z0-9!#\\$%&'\\*\\+/=\\?\\^_`\\{|\\}~\\-]{1,}(?:\\.[a-z0-9!#\\$%&'\\*\\+/=\\?\\^_`\\{|\\}~\\-]{1,}){0,}@(?:[a-z0-9](?:[a-z0-9\\-]{0,}[a-z0-9]){0,1}\\.){1,}[a-z0-9](?:[a-z0-9\\-]{0,}[a-z0-9]){0,1}", "g");
var regexSign = new RegExp("((\\<div\\ id\\ =\\ \"signature\"\\>).{0,}?(\\</div\\>)|(\\<div\\ id=signature\\>).{0,}?(\\</div\\>))");
var signModule = {};
// bug: exclude/include userscript headers don't work in Chrome, so we filter manually
if(window.location.hostname.match(/mail.google.com/) != null) {

    // insert the browser action icon in the address bar
    chrome.extension.sendRequest({}, function(response) {});

     signModule = {
        loaded:false,
        messageBox: null,
        sign: null
    };

    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if(message.message = "updated simple signature's signature") {
            chrome.storage.local.get(null, function(item) {
                signModule.sign = JSON.parse(item["simplesignature_signs"]);
                loadStageTwo();
            });
        }
    });
    // load jQuery from CDN...
    var script = document.createElement("script");
    script.setAttribute("src","//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js");
    document.getElementsByTagName("head")[0].appendChild(script);


    // function to inject jQuery onto the page, as well as the signModule object
	function with_jquery(f, signModule) {
        var script = document.getElementById("signModule"); 
        if(script) {
            script.textContent = "(" + f.toString() + ")(jQuery, "+JSON.stringify(signModule)+")";
        }
        else {
    		script = document.createElement("script");
            script.id="signModule";
    		script.type = "text/javascript";
    		script.textContent = "(" + f.toString() + ")(jQuery, "+JSON.stringify(signModule)+")";
    		document.body.appendChild(script);
        }
	};

    // pull the quotes out of storage, or load the defaults from quotes.js if none found
    function load_sign() {
        chrome.storage.local.get(null, function(items) {
            if(items["simplesignature_signs"] != null) signModule.sign = JSON.parse(items["simplesignature_signs"]);
            chrome.runtime.sendMessage({message:"update simple signature's signature"},function(response){
                if(response == "ok") {
                    chrome.storage.local.get(null, function(item) {
                        signModule.sign = JSON.parse(item["simplesignature_signs"]);
                        loadStageTwo();
                    }); 
                }
            });
        });
    };


    load_sign();

    window.addEventListener("load", function() { 
        signModule.loaded = true;
        loadStageTwo();
    });
        

    function loadStageTwo() {
        console.log(signModule);
        if(signModule.loaded) {
            with_jquery(function($, signModule) {

                // this handles injecting the quote into the Gmail compose textarea
                function injectSignInTextarea() {

                    var messageBox = null;
                    messageBox = $('[g_editable="true"]').eq($('[g_editable="true"]').length-1);
                    // don't inject quotes in the textareas in the settings page, that's just not cool...
                    if(messageBox.attr('aria-label') != "Message Body" && messageBox.attr('aria-label') != "Corps du message") return;

                    destinataires = $('input[name="to"]');
                    messageBox.interne=true;
                     destinataires.each(function(i,e) {
                        var mail = regexMail.exec(e.val());
                        if(mail!=null && mail.split('@')[1] !=null && (localStorage["simplesignature_mailInterne"] == null || $.inArray(mail.split('@')[1],localStorage["simplesignature_mailInterne"].split(";"))) ) 
                            messageBox.interne=false;
                    });
                    // there's no signature block, so inject at the bottom
                    if(messageBox.find('div#signature').html() == undefined && messageBox.html() != undefined && messageBox.parent().parent().parent().parent().parent().parent().parent().parent().parent().find('[aria-label="Show trimmed content"]').length == 0) {
                        
                        messageBox.action = "init";

                    // saying no to injecting quoets in replies for now...
                    } else if(messageBox.html() != undefined && messageBox.parent().parent().parent().parent().parent().parent().parent().parent().parent().find('[aria-label="Show trimmed content"]').length != 0) {
                        
                        messageBox.action = "replace";

                    } else {

                        // there is no textarea to inject into...
                        messageBox = null;
                    }
                    // assuming there is a textarea, inject a quote
                    if(messageBox != null && messageBox.action == "init") {
                        setTimeout(function() {
                            messageBox.html("<br /><br />"+getSignature(messageBox.interne));
                            messageBox.action = "replace";
                        }, 1000);
                    }
                    else if(messageBox != null && messageBox.action == "replace") {
                        setTimeout(function() {
                            messageBox.html(messageBox.html().replace(regexSign,getSignature(messageBox.interne)));
                        }, 1000);
                    }
                   
                }

                function getSignature(interne) {
                    
                    if(!signModule.sign) {
                        //load_sign();
                        return "erreur, try again in a little while";
                    } 
                    else {
                        for(var i = 0; i<signModule.sign.length;i++) {
                            if((signModule.sign[i].name =="externe default" && !interne) || (signModule.sign[i].name =="interne default" && interne)) {
                                return signModule.sign[i].value;
                            }
                        }
                        return "no signature found";
                    }
                }                        

                // when DOM nodes are inserted in the page, look for a compose window and inject
                window.addEventListener("DOMNodeInserted", function() {

                        injectSignInTextarea();
                }, false);
                
                 
            }, signModule);
        }
        
            
    };
}