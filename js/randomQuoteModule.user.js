// ==UserScript==
// @name           Random Gmail Signature Quotes 
// @namespace      http://google.com 
// @author         jmort253 (http://stackoverflow.com/users/552792)
// @description    Chrome Extension to inject random quotes into Gmail signatures.
// @homepage       http://blog.opensourceopportunities.com
// @copyright      2013, James Mortensen (http://stackoverflow.com/users/552792/jmort253) 
// @license        MIT License or BSD License
// @version        0.9.2
// @include        https://*google.com/*
// @history        0.9 initial beta release to the public in Github
// @history        0.9.2 initial beta release to the public in the Chrome Web Store with Stack Exchange flair import support
// ==/UserScript==

/* 
 * Copyright 2013, James Mortensen
 *
 * In case it isn't clear, this is licensed under the MIT License. So do with this what you please.
 *
 */
var regexMail = new RegExp("[a-z0-9!#\\$%&'\\*\\+/=\\?\\^_`\\{|\\}~\\-]{1,}(?:\\.[a-z0-9!#\\$%&'\\*\\+/=\\?\\^_`\\{|\\}~\\-]{1,}){0,}@(?:[a-z0-9](?:[a-z0-9\\-]{0,}[a-z0-9]){0,1}\\.){1,}[a-z0-9](?:[a-z0-9\\-]{0,}[a-z0-9]){0,1}", "g");
var regexSign = new RegExp("((\\<div\\ id\\ =\\ \"signature\"\\>).{0,}?(\\</div\\>)|(\\<div\\ id=signature\\>).{0,}?(\\</div\\>))");
var randomQuoteModule = {};

// bug: exclude/include userscript headers don't work in Chrome, so we filter manually
if(window.location.hostname.match(/mail.google.com/) != null) {

    // insert the browser action icon in the address bar
    chrome.extension.sendRequest({}, function(response) {});

     randomQuoteModule = {
        init: false,
        messageBox: null,
        quotes: null,
        loaded: false
    };

 
    // load jQuery from CDN...
    var script = document.createElement("script");
    script.setAttribute("src","//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js");
    document.getElementsByTagName("head")[0].appendChild(script);


    // function to inject jQuery onto the page, as well as the randomQuoteModule object
	function with_jquery(f, randomQuoteModule) {
		var script = document.createElement("script");
		script.type = "text/javascript";
		script.textContent = "(" + f.toString() + ")(jQuery, "+JSON.stringify(randomQuoteModule)+")";
		document.body.appendChild(script);
	};

    // pull the quotes out of storage, or load the defaults from quotes.js if none found
    chrome.storage.local.get(null, function(items) {
        console.log("items = " + JSON.stringify(items) );iii = items;
        if(items["m_quotes"] == null) {
            items["m_quotes"] = m_quotes;
            chrome.storage.local.set(items);
        }
        m_quotes = items["m_quotes"];

        randomQuoteModule.quotesLoaded = true;
        if(randomQuoteModule.pageLoaded == true && randomQuoteModule.quotesLoaded == true) {
            loadStageTwo();
        }

    });

    window.addEventListener("load", function() { 
        randomQuoteModule.pageLoaded = true;
        if(randomQuoteModule.pageLoaded == true && randomQuoteModule.quotesLoaded == true) {
            loadStageTwo();
        } 
    });
        

    function loadStageTwo() {
        if(randomQuoteModule.init == true) return;
        
        randomQuoteModule.init = true;
        randomQuoteModule.quotes = m_quotes;
    	

        with_jquery(function($, randomQuoteModule) {

            // this handles injecting the quote into the Gmail compose textarea
            function injectQuoteInTextarea() {

                var messageBox = null;
                messageBox = $('[g_editable="true"]').eq($('[g_editable="true"]').length-1);
                // don't inject quotes in the textareas in the settings page, that's just not cool...
                if(messageBox.attr('aria-label') != "Message Body" && messageBox.attr('aria-label') != "Corps du message") return;

                destinataires = $('input[name="to"]');
                messageBox.interne=true;
                 destinataires.each(function(i,e) {
                    var mail = regexMail.exec(e.val());
                    if(mail!=null && mail.split('@')[1] !=null && (localStorage["simple_signature_mail_interne"] == null || $.inArray(mail.split('@')[1],JSON.parse(localStorage["simple_signature_mail_interne"]))) ) 
                        messageBox.interne=false;
                });
                // there's no signature block, so inject at the bottom
                if(messageBox.find('div#signature').html() == undefined && messageBox.html() != undefined && messageBox.parent().parent().parent().parent().parent().parent().parent().parent().parent().find('[aria-label="Show trimmed content"]').length == 0) {
                    
                    messageBox.action = "init";

                // saying no to injecting quoets in replies for now...
                } else if(messageBox.html() != undefined && messageBox.parent().parent().parent().parent().parent().parent().parent().parent().parent().find('[aria-label="Show trimmed content"]').length != 0) {
                    
                    messageBox.action = "replace";
                    messageBox=null;

                } else {

                    // there is no textarea to inject into...
                    messageBox = null;
                }

                // assuming there is a textarea, inject a quote
                if(messageBox != null && messageBox.action == "init") {
                    setTimeout(function() {
                        messageBox.html(getSignature(messageBox.interne));
                    }, 1000);
                }
                else if(messageBox != null && messageBox.action == "replace") {
                    setTimeout(function() {
                        messageBox.html(messageBox.html().replace(regexSign,getSignature(messageBox.interne)));
                    }, 1000);
                }
               
            }

            
            function getSignature(interne) {
                
                var len = randomQuoteModule.quotes.length;

                var index = (new Date().getTime() % len);

                return randomQuoteModule.quotes[index];
            }            

            // TODO: trying to allow updating the quotes without reloading -- in progress
            // top.window.updateRandomQuotes = function(quotes) {

            //     randomQuoteModule.quotes = quotes;
            // }
            

            // when DOM nodes are inserted in the page, look for a compose window and inject
            window.addEventListener("DOMNodeInserted", function() {
                    injectQuoteInTextarea();
            }, false);
            
             
    	}, randomQuoteModule);
            
    };
}
