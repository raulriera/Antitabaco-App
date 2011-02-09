var win = Titanium.UI.currentWindow;

// create a button to close window
var close_btn = Titanium.UI.createButton({
	title: L("places_close_button")
});

// Listen for when the button is clicked
close_btn.addEventListener('click', function()
{
	win.close();
});

// Create the table view that will hold all the nearby places
var placesTableData = [];
var places_table = Titanium.UI.createTableView({
	data: placesTableData,
	backgroundColor: 'transparent'
});

var refresh_btn = Titanium.UI.createButton({
	systemButton:Titanium.UI.iPhone.SystemButton.REFRESH
});

// Create a variable for all HTTP requests
var xhr = Titanium.Network.createHTTPClient();

// Create the activity indicator message
var activity_indicator = Titanium.UI.createActivityIndicator({
	style: Titanium.UI.iPhone.ActivityIndicatorStyle.DARK,
	width: 210,
	height: 50
});

// Add the activity indicator
win.add(activity_indicator);

// Attach the refresh button to the nav bar
win.rightNavButton = refresh_btn;
// Attach the close button to the nav bar
win.leftNavButton = close_btn;

xhr.onerror = function(e) {
    alert(L("places_error_message"));
};

xhr.onload = function(e) {
		
	// Read from JSON 
	var places_data = JSON.parse(this.responseText);
	places_data = places_data.data;
	
	// Clear the current data
	placesTableData = [];
	
	// Build the table rows by looping through the JSON
	for(var k=0, dataSize = places_data.length; k < dataSize; k++){
		if(places_data){		
			var row = Titanium.UI.createTableViewRow({ 
				place: places_data[k],
				title: places_data[k].name,
				color: "#133651",
				backgroundImage: "../images/table_view_row.png",
				leftImage: "../images/table_view_row_image.png"
			});
			
			placesTableData.push(row);
		}
	};
		
	// Add the table view to the window
	win.add(places_table);
	
	// Set the data back in
	places_table.setData(placesTableData);
	
	// Hide the activity indicator
	activity_indicator.hide();
	
};

function fetchNearbyFacebookPlaces(){
	
	// Retrieve the information stored about the user 
	var facebook = JSON.parse(Ti.App.Properties.getString('facebook'));
	
	// Show the activity indicator
	activity_indicator.show();
	//refresh_btn.systemButton = Titanium.UI.iPhone.SystemButton.SPINNER;
	
	// Set the purpose of this GPS event
	Titanium.Geolocation.purpose = L("geolocation_purpose_message");
	
	// Get the current position of this device
	Titanium.Geolocation.getCurrentPosition(function(e)
	{		
		if (e.error)
		{
			alert(L("geolocation_error_message"));
			return;
		}
				
		var longitude = e.coords.longitude;
		var latitude = e.coords.latitude;
		var altitude = e.coords.altitude;
		var heading = e.coords.heading;
		var accuracy = e.coords.accuracy;
		var speed = e.coords.speed;
		var timestamp = e.coords.timestamp;
		var altitudeAccuracy = e.coords.altitudeAccuracy;
		
		// Search the Social Graph for nearby places
		xhr.open('GET','https://graph.facebook.com/search?type=place&center=' + latitude +  ',' + longitude + '&distance=1000&access_token=' + facebook.session.access_token);
		xhr.send();
	});
}

// Listen for each time a row is clicked
places_table.addEventListener('click', function(e)
{
	// Fire a custom event with the selected place info
	Titanium.App.fireEvent('placeClicked', e.rowData.place);
	
	win.close();
});

// Listen for everytime the refresh button is clicked
refresh_btn.addEventListener('click', function(e)
{
	Titanium.Facebook.sessionForAccessToken();
});

// Listen for when the session is exchanged (an oAuth login)
Titanium.App.addEventListener('oAuthLogin', function(facebook) {
	// Fetch the nearby places
	fetchNearbyFacebookPlaces();
});

// Function to exchange the current Facebook session for an access token
Titanium.Facebook.sessionForAccessToken = function(callback) {
   	// Check if the user as already logged into Facebook
	if (!Titanium.Facebook.isLoggedIn()) {
		// Open the login window
		app.loginWindow.open({modal: true});
	} else {
     	var app_id = '[appid]';
        var app_secret = '[appsecret]';
        
		// Create a variable for all HTTP requests
		var xhr = Titanium.Network.createHTTPClient();

        xhr.onerror = function(e)
    	{
			alert(L("places_error_message"));
    		callback(false);
    	};
    	xhr.setTimeout(10000);
    	xhr.onload = function(e)
    	{			
            var resultObj = JSON.parse(this.responseText); //should contain resultObj.access_token & resultObj.expires
			
			// Return the result
            if (resultObj[0].access_token != undefined) {                
                //callback(resultObj); //returning the first item  

				// Store the facebook info
				var facebook = {};
				facebook.session = resultObj[0]; // access_token and expires

				// Convert to string and save as property
				Ti.App.Properties.setString('facebook', JSON.stringify(facebook));

				// Fire a custom event with the facebook login info
				Titanium.App.fireEvent('oAuthLogin', facebook);
              
            } else {
                // callback(false);
				// There was a problem, let's just ppen the login window
				app.loginWindow.open({modal: true});
            }
    	};
    	// open the client
    	xhr.open('POST','https://graph.facebook.com/oauth/exchange_sessions');

    	// send the client_id, client_secret and comma delimited sessions (only 1 in this case)
		xhr.send({
			client_id: app_id, 
			client_secret: app_secret, 
			sessions: Titanium.Facebook.session.session_key
		});
	} 
};

// Show the activity indicator
activity_indicator.show();

// Exchange the current session with a valid oAuth session
Titanium.Facebook.sessionForAccessToken();