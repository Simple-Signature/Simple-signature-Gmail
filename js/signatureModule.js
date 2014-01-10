var signModule = {};
// bug: exclude/include userscript headers don't work in Chrome, so we filter manually
if(window.location.hostname.match(/mail.google.com/) != null) {

    // insert the browser action icon in the address bar
    chrome.extension.sendRequest({}, function(response) {});

     signModule = {
        loaded:false,
        messageBox: null,
        sign: null,
        mailInterne: null
    };

    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if(message.message = "updated simple signature's signature") {
            chrome.storage.local.get(null, function(item) {
                signModule.sign = JSON.parse(item["simplesignature_signs"]);
                signModule.mailInterne = item["simplesignature_mailInterne"];
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
            if(items["simplesignature_signs"] != null) {
                signModule.sign = JSON.parse(items["simplesignature_signs"]);
                signModule.mailInterne = items["simplesignature_mailInterne"];
            }
            chrome.runtime.sendMessage({message:"update simple signature's signature"},function(response){
                if(response == "ok") {
                    chrome.storage.local.get(null, function(item) {
                        signModule.sign = JSON.parse(item["simplesignature_signs"]);
                        signModule.mailInterne = item["simplesignature_mailInterne"];
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
        if(signModule.loaded) {
            with_jquery(function($, signModule) {
                var regexMail = new RegExp("[a-z0-9!#\\$%&'\\*\\+/=\\?\\^_`\\{|\\}~\\-]{1,}(?:\\.[a-z0-9!#\\$%&'\\*\\+/=\\?\\^_`\\{|\\}~\\-]{1,}){0,}@(?:[a-z0-9](?:[a-z0-9\\-]{0,}[a-z0-9]){0,1}\\.){1,}[a-z0-9](?:[a-z0-9\\-]{0,}[a-z0-9]){0,1}", "g");
                var regexSign = new RegExp("(\\<div\\ id=\"signature\"\\>).{0,}?(\\</div\\>)", "g");
                var mailInterne = signModule.mailInterne ? signModule.mailInterne.split(";") : signModule.mailInterne;
                var interne = null;
                var messageBoxCons = null;
                // this handles injecting the quote into the Gmail compose textarea
                function injectSignInTextarea() {
                    var messageBox = null;
                    
                    messageBox = $('[g_editable="true"]').eq($('[g_editable="true"]').length-1);
                    if(!messageBox) interne = null;
                    // don't inject quotes in the textareas in the settings page, that's just not cool...
                    if( !messageBox || (messageBox.attr('aria-label') != "Message Body" && messageBox.attr('aria-label') != "Corps du message")) return;
                    
                    if(!messageBox.attr('simple_signature_timestamp')) messageBox.attr('simple_signature_timestamp', (new Date()).getTime());

                    if((!messageBoxCons || messageBox.attr('simple_signature_timestamp') != messageBoxCons.attr('simple_signature_timestamp')) && messageBox.html() != undefined) {
                        messageBox.action = "init";

                    } else if(messageBox.html() != undefined) {
                        
                        messageBox.action = "replace";

                    } else {
                      // there is no textarea to inject into...
                        messageBox = null;
                    }
                    if( messageBox && messageBox.action == "init") interne = null;
                    destinataires = $('input[name="to"]');
                    
                    if(messageBox == null || (interne !== null && (!destinataires || !destinataires.length || destinataires.length==0))) return;

                    messageBox.interne = mailInterne != null && mailInterne.length != 0;
                    destinataires.each(function(i,e) {                          
                        var mail = regexMail.exec($(e).val().toLowerCase())

                        if (mail == null) messageBox.interne = "error";                      
                        mail = mail && mail.length ? mail[0] : mail;
                        if(mail!=null && mail.split('@')[1] !=null && (mailInterne == null || mailInterne == "" || $.inArray(mail.split('@')[1],mailInterne)) ) {
                            messageBox.interne=false;
                        }
                    });
                    
                    if(messageBox.interne=="error") return;

                    if(interne == messageBox.interne) return;
                    interne = messageBox.interne;
                    
                    // assuming there is a textarea, inject a quote
                    if(messageBox != null && messageBox.action == "init") {
                        messageBoxCons = messageBox;
                        setTimeout(function() {
                            messageBox.html("<br /><br /><div id=\"signature\">"+getSignature(messageBox.interne)+"</div>");
                        }, 1000);
                    }
                    else if(messageBox != null && messageBox.action == "replace") {
                        console.log('replace');
                        setTimeout(function() {
                            messageBox.html(messageBox.html().replace(regexSign,"<div id=\"signature\">"+getSignature(messageBox.interne)+"</div>"));
                        }, 1000);
                    }
                   
                }

                function getSignature(intern) {
                    
                    if(!signModule.sign) {
                        //load_sign();
                        return "erreur, try again in a little while";
                    } 
                    else {
                        if(intern) return getInterneSign();
                        else return getFirstSign();
                    }
                }   

                function getInterneSign() {
                    console.log("interne");
                    if(!signModule.sign) {
                        //load_sign();
                        return "erreur, try again in a little while";
                    } 
                    else {
                        for(var i = 0; i<signModule.sign.length;i++) {
                            if(signModule.sign[i].name =="interne default") {
                                return signModule.sign[i].value;
                            }
                        }
                        return "no signature found";
                    }
                }  

                function getExterneSign() {
                    console.log("externe");
                    if(!signModule.sign) {
                        //load_sign();
                        return "erreur, try again in a little while";
                    } 
                    else {
                        for(var i = 0; i<signModule.sign.length;i++) {
                            if(signModule.sign[i].name =="externe default") {
                                console.log(signModule.sign[i].value);
                                return signModule.sign[i].value;
                            }
                        }
                        return getInterneSign();
                    }
                }   

                function getFirstSign() {
                    console.log("first");
                    if(!signModule.sign) {
                        //load_sign();
                        return "erreur, try again in a little while";
                    } 
                    else {
                        for(var i = 0; i<signModule.sign.length;i++) {
                            if(signModule.sign[i].name !="externe default" && signModule.sign[i].name !="interne default") {
                                return signModule.sign[i].value;
                            }
                        }
                        return getExterneSign();
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