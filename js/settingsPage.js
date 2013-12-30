chrome.storage.local.get(null, function(items) {
    if(items["simplesignature_URLSimpleSign"] == null) {
        items["simplesignature_URLSimpleSign"] = "http://simplesignature.meteor.com";
        chrome.storage.local.set(items);
    }

    $('#name').val(items["simplesignature_lastName"]);
    $('#firstname').val(items["simplesignature_firstName"]);
    $('#mail').val(items["simplesignature_mail"]);
    $('#phone').val(items["simplesignature_phone"]);
    $('#job').val(items["simplesignature_job"]);
    $('#firm').val(items["simplesignature_firm"]);
    $('#service').val(items["simplesignature_service"]);
    $('#url').val(items["simplesignature_URLSimpleSign"]);
    $('#mailInterne').html(items["simplesignature_mailInterne"]);
});

window.addEventListener("load", function() {
	
	$('[data-action="save"]').click(function() {
		var items = {};
		items["simplesignature_lastName"] = $('#name').val();
		items["simplesignature_firstName"] = $('#firstname').val();
		items["simplesignature_mail"] = $('#mail').val();
		items["simplesignature_phone"] = $('#phone').val();
		items["simplesignature_job"] = $('#job').val();
		items["simplesignature_firm"] = $('#firm').val();
		items["simplesignature_service"] = $('#service').val();
		items["simplesignature_URLSimpleSign"] = $('#url').val();
		items["simplesignature_mailInterne"] = $('#mailInterne').val();
		chrome.storage.local.set(items, function() {
			chrome.runtime.sendMessage({message:"update simple signature's signature"});
			window.close();
		});
	});

	$('[data-action="cancel"]').click(function() {
        window.close();
	});

}, false);