import liboauth

#puts "First, go register a new application at "
#puts "http://api06.dev.openstreetmap.org/oauth_clients/new"
#puts "Tick the appropriate boxes"
#puts "Enter the consumer key you are assigned:"
#puts "Enter the consumer secret you are assigned:"
#puts "Your application is now set up, but you need to register"
#puts "this instance of it with your user account."

auth = {}
auth["site"] = "http://api06.dev.openstreetmap.org"
auth["consumer_key"] = "***"
auth["consumer_secret"] = "***"

auth = {}
#res_sync_test
#url http://localhost:3000/
auth["site"] = "http://api.openstreetmap.org"
auth["consumer_key"] = "bHLUApd1vffCUflFnXSvF6ZKmA62paPBAcXJQOww"
auth["consumer_secret"] = "McvKleN6YXiv2paO1L3KjzjkMkCAqQjGAJHscl5b"
#Request Token URL: http://www.openstreetmap.org/oauth/request_token
#Access Token URL: http://www.openstreetmap.org/oauth/access_token
#Authorise URL: http://www.openstreetmap.org/oauth/authorize

consumer=liboauth.OAuthConsumer(auth["consumer_key"], auth["consumer_secret"])

 #,{:site=>"http://api06.dev.openstreetmap.org"}
 
@request_token = @consumer.get_request_token
 
puts "Visit the following URL, log in if you need to, and authorize the app"
puts @request_token.authorize_url
puts "When you've authorized that token, enter the verifier code you are assigned:"
verifier = gets.strip                                                                                                                                                               
puts "Converting request token into access token..."                                                                                                                                
@access_token=@request_token.get_access_token(:oauth_verifier => verifier)                                                                                                          
 
auth["token"] = @access_token.token
auth["token_secret"] = @access_token.secret
 
File.open('auth.yaml', 'w') {|f| YAML.dump(auth, f)}
 
puts "Done. Have a look at auth.yaml to see what's there."

http://api06.dev.openstreetmap.org/api/capabilities