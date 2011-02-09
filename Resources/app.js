// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

// Facebook login button
var facebook_btn = Titanium.Facebook.createLoginButton({
	style: "wide",
	apikey: '[apikey]',
	secret: '[secret]',
	height: 30,
	top: 250,
	width: 300
});

// Create main app window
var app = {
	"window" : Titanium.UI.createWindow({backgroundImage: 'images/background_home.png', top: 0}),
	"userId" : JSON.parse(Titanium.App.Properties.getString('userId')),
	"selectedPlace" : {}
};

// Open the main application window
app.window.open();

// Making a single function so I don't clutter the global scope
(function() {
	
	// Setup the UI
	app.loginWindow = Titanium.UI.createWindow({
		backgroundColor: '#fff', 
		backgroundImage: '../images/background_login.png',
		url: "windows/login.js"
	});
	
	app.profileWindow = Titanium.UI.createWindow({
		// backgroundImage: '../images/background.png',
		backgroundColor: '#fff', 
		url: "windows/profile.js",
		title: L("profile_window_title"),
		barColor: "#0574A0"
	});
	
	app.placesWindow = Titanium.UI.createWindow({
		backgroundColor: '#fff', 
		backgroundImage: '../images/background.png',
		url: "windows/places.js",
		title: L("places_window_title"),
		barColor: "#0574A0"
	});
			
	app.profile_button = Titanium.UI.createButton({
		top: 10,
		right: 10,
		width: 25,
		height: 25,
		backgroundColor: "transparent",
		backgroundImage: "images/profile_button.png"
	});
	
	app.report_button = Titanium.UI.createButton({
		backgroundImage: "images/report_button_enabled.png",
		backgroundDisabledImage: "images/report_button_disabled.png",
		title: L("report_button_text"),
		width: 156,
		height: 48,
		top: 345
	});
		
	// Construct the UI
	app.window.add(app.profile_button);
	app.window.add(app.report_button);
			
	// Check if the user as already logged into Facebook
	if (!Titanium.Facebook.isLoggedIn()) {
		// Open the login window
		app.loginWindow.open({modal: true, navBarHidden: true});
	}
	
	// Listen for everytime the user clicks on the "profile" button
	app.profile_button.addEventListener("click", function()
	{
		// Open the profile window with a nice effect
		app.profileWindow.open({modal: true});
	});
	
	// Listen for when the report button is clicked
	app.report_button.addEventListener("click", function()
	{	
		app.placesWindow.open({modal: true});
	});
	
	
	// Make this function for future setup checkings
	function checkSetup(){
		var privacy_setting = Titanium.App.Properties.getBool('publish_anonymously');
		var publish_facebook_setting = Titanium.App.Properties.getBool('publish_facebook');
		
		// Check the user settings
		if (privacy_setting === null) {
			Titanium.App.Properties.setBool('publish_anonymously', false);
		}
		if (publish_facebook_setting === null) {
			Titanium.App.Properties.setBool('publish_facebook', false);
		}
	}
	
	// Check the current setup
	checkSetup();
	
})();

// Listen for the login event in Facebook
Titanium.Facebook.addEventListener('login', function(e) {	
	// Store the info in the 
	Titanium.App.Properties.setString('userId', Titanium.Facebook.userId);
	
	// Close the login info and continue with the app
	app.loginWindow.close();
});

// Listen for whenever the user clicks on a place
Titanium.App.addEventListener('placeClicked', function(place) {
	// Set the selected place to something globally
	app.selectedPlace = place;
	
	// Create the request that will submit this report
	var xhr = Titanium.Network.createHTTPClient();
		
	// Set the report address
	xhr.open('POST', '[POST-URL]');
	
	Titanium.Geolocation.reverseGeocoder(app.selectedPlace.location.latitude, app.selectedPlace.location.longitude, function(evt)
	{
		if (evt.success) {
			var places = evt.places;
			if (places && places.length) {
				app.selectedPlace.address = places[0].address;
			} else {
				app.selectedPlace.address = "N/A";
			}
		}
		
		// Send the request
		xhr.send({
			placeId: app.selectedPlace.id,
			placeName: app.selectedPlace.name,
			placeAddress: app.selectedPlace.address,
			placeLatitude: app.selectedPlace.location.latitude,
			placeLongitude: app.selectedPlace.location.longitude,
			userId: Titanium.App.Properties.getString('userId'),
			secretKey: "[secretKey]",
			isPublic: Titanium.App.Properties.getBool('publish_anonymously')
		});
		
	});
			
	// Disable the button once again
	app.report_button.enabled = false;
	
	xhr.onerror = function(e) {
	    alert(L("reporting_error_message"));
	
		// Renable the button
		app.report_button.enabled = true;
	};

	xhr.onload = function() {
		// Instantiate an alert dialog
		var alert_dialog = Titanium.UI.createAlertDialog();
			
		// For some reason I don't get back anything with accent, so just skip validation and assume everything worked
		alert_dialog.title = L("reporting_success_title");
		alert_dialog.message = String.format(L("reporting_success_message"), app.selectedPlace.name);
		alert_dialog.show();
		
		// Check if the user wants to send the report to Facebook
		if (Titanium.App.Properties.getBool('publish_facebook')) {
			var publish_facebook_xhr = Titanium.Network.createHTTPClient();

			// Open a request to publish on the user wall
			publish_facebook_xhr.open('POST', 'https://graph.facebook.com/me/feed');
			publish_facebook_xhr.send({
				access_token: JSON.parse(Ti.App.Properties.getString('facebook')).session.access_token,
				message: String.format(L("reporting_success_facebook_message"), app.selectedPlace.name),
				actions: '{"name": "' + L("reporting_facebook_message_action") + '", "link": "http://www.antitabacoapp.com/places/show/' + app.selectedPlace.id + '"}'
			});
		}
		
		// Reset the selected place
		app.selectedPlace = {};
		// Renable the report button
		app.report_button.enabled = true;
		
		// Set the last reported at to now
	};
	
});

// Listen for a change in the cellular data network
Titanium.Network.addEventListener('change', function(e) {
	var type = e.networkType;
	var online = e.online;
	var networkTypeName = e.networkTypeName;
	var alert_dialog = Titanium.UI.createAlertDialog({
		title: L("no_network_title"),
		message: L("no_network_message")
	});
	
	// Alert the user that a network connection is required
	if (!online) {
		alert_dialog.show();
	}	
});