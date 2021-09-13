// You can try it from browser's console
var app = sf.model('the-app');

// Scope for <sf-m name="the-app">
sf.model('the-app', function(self, root){
	self.presenter = root('presenter');
	self.streamer = root('streamer');

	self.id = '';
});