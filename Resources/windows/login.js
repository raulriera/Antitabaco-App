var win = Titanium.UI.currentWindow;

// Current window that holds everything
var view = Titanium.UI.createView({
	left: 20,
	right: 20,
	top: 10,
	height: "auto"
});

// Greeting message
var greeting_message = Titanium.UI.createLabel({
	text: L("greeting_message"),
	font: {fondFamily: "ArialHebrew"},
	height: "auto",
	top: 60,
	textAlign: "center",
	color: "#7F7F7E"
});

var welcome_message = Titanium.UI.createLabel({
	text: L("welcome_message"),
	color: "#7F7F7E",
	font: {fondFamily: "ArialHebrew", fontWeight: "bold"},
	top: 160,
	height: "auto",
	textAlign: "center"
});

// Facebook login button
var facebook_btn = Titanium.Facebook.createLoginButton({
	style: "wide",
	apikey: '[apikey]',
	secret: '[secret]',
	height: 30,
	top: 250,
	width: 300
});

view.add(greeting_message);
view.add(welcome_message);
view.add(facebook_btn);

win.add(view);
