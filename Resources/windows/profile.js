var win = Titanium.UI.currentWindow;

// create a button to close window
var close_btn = Titanium.UI.createButton({
	title: L("profile_close_button"),
	left: 10,
	right: 10,
	height: 50
});

// Attach the close button to the nav bar
win.leftNavButton = close_btn;

// Listen for when the button is clicked
close_btn.addEventListener('click', function()
{
	win.close();
});

// Create table view data object
var data = [];

// Create the publish anonymously row
var publish_anonymously_row = Ti.UI.createTableViewRow({
	header: L("privacy_settings_label"),
	height: 50,
	backgroundColor: "#fff",
	touchEnabled: false,
	editable: false
});
var publish_anonymously_label = Ti.UI.createLabel({
	left: 10,
	font: { fontSize: 16 },
	text: L("profile_publish_anonymously_switch")
});
var publish_anonymously_switch = Ti.UI.createSwitch({
	right: 10,
	value: Titanium.App.Properties.getBool('publish_anonymously')
});

// Create the publish to facebook row
var publish_facebook_row = Ti.UI.createTableViewRow({
	height: 50,
	backgroundColor: "#fff",
	touchEnabled: false,
	editable: false
});
var publish_facebook_label = Ti.UI.createLabel({
	left: 10,
	font: { fontSize: 16 },
	text: L("profile_publish_facebook_switch")
});
var publish_facebook_switch = Ti.UI.createSwitch({
	right: 10,
	value: Titanium.App.Properties.getBool('publish_facebook')
});

// Append the controls to the publish anonymously row
publish_anonymously_row.add(publish_anonymously_label);
publish_anonymously_row.add(publish_anonymously_switch);

// Append the controls to the publish facebook row
publish_facebook_row.add(publish_facebook_label);
publish_facebook_row.add(publish_facebook_switch);

// Listen for everytime the publish anonymously switch is toggled
publish_anonymously_switch.addEventListener('change', function(e) {
	Titanium.App.Properties.setBool('publish_anonymously', e.value);
});

// Listen for everytime the facebook switch is toggled
publish_facebook_switch.addEventListener('change', function(e) {
	// Check if we have permission to publish checkins on behalf of the user
	if (!Titanium.Facebook.hasPermission("publish_stream")) {

		Titanium.Facebook.requestPermission("publish_stream", function(evt) {
			if (evt.success) {
				// Allow
				Titanium.App.Properties.setBool('publish_facebook', true);
			} else {
				// Disallow
				Titanium.App.Properties.setBool('publish_facebook', false);
				// Set it back to "off"
				e.source.value = false;
			}
		});
	} else {
		// Toggle the permission
		Titanium.App.Properties.setBool('publish_facebook', e.value);
	}

});

// Add the rows to the data
data.push(publish_anonymously_row);
data.push(publish_facebook_row);

// Create the table view that will hold the settings
var settingsTable = Ti.UI.createTableView({
	data: data,
	style: Titanium.UI.iPhone.TableViewStyle.GROUPED,
	top: 0,
	editable: true
});

// Create the HTTP client
var xhr_reports = Titanium.Network.createHTTPClient();

xhr_reports.open("POST", "[POST-URL]");

xhr_reports.send({
	userId: Titanium.App.Properties.getString('userId'),
	secretKey: "[secretKey]",
	format: "json"
});

xhr_reports.onload = function(e) {
		
	// Read from JSON 
	var reports_data = JSON.parse(this.responseText);
	
	// Clear the current data
	current_reports_data = [];
	
	// Build the table rows by looping through the JSON
	for(var k=0, dataSize = reports_data.length; k < dataSize; k++){
		if(reports_data){		
			var row = Titanium.UI.createTableViewRow({ 
				title: reports_data[k].placeName,
				color: "#133651",
				report: reports_data[k],
				backgroundColor: "#fff"
			});
			
			if (k === 0){
				row.header = L("report_listing_label");
			}
			
			//current_reports_data.push(row);
			data.push(row);
		}
	};
		
	// Set the data back in
	// reportsTable.setData(current_reports_data);
	settingsTable.data = data;
};

settingsTable.addEventListener("delete", function(e){
	
	var xhr_delete = Titanium.Network.createHTTPClient();

	xhr_delete.open("POST", "[DELETE-URL]");
	
	xhr_delete.send({
		key: e.rowData.report.id,
		secretKey: "[secretKey]",
		format: "json"
	});
});

win.add(settingsTable);