#!/usr/bin/ruby
 
# Simple OSM Auth example showing GET PUT and DELETE methods
# Requires OAuth rubygem
 
require 'rubygems'
require 'oauth'
require 'date'
require 'yaml'
 
# Format of auth.yml:
# consumer_key: (from osm.org)
# consumer_secret: (from osm.org)
# token: (use oauth setup flow to get this)
# token_secret: (use oauth setup flow to get this)
 
# The consumer key and consumer secret are the identifiers for this particular application, and are 
# issued when the application is registered with the site. Use your own.

def test_local
	auth = YAML.load(File.open('local_auth.yaml'))
	@consumer=OAuth::Consumer.new auth['consumer_key'], 
                                  auth['consumer_secret'], 
                                  {:site=>"http://localhost:3000"}
	# Create the access_token for all traffic
	return OAuth::AccessToken.new(@consumer, auth['token'], auth['token_secret']) 
end

def test_live
	auth = YAML.load(File.open('live_auth.yaml'))
	@consumer=OAuth::Consumer.new auth['consumer_key'], 
                                  auth['consumer_secret'], 
                                  {:site=>"http://www.openstreetmap.org"}
	# Create the access_token for all traffic
	return OAuth::AccessToken.new(@consumer, auth['token'], auth['token_secret']) 
end

def test_dev
	auth = YAML.load(File.open('dev_auth.yaml'))
	@consumer=OAuth::Consumer.new auth['consumer_key'], 
                                  auth['consumer_secret'], 
                                  {:site=>"http://api06.dev.openstreetmap.org"}
	# Create the access_token for all traffic
	return OAuth::AccessToken.new(@consumer, auth['token'], auth['token_secret'])  
end

def test_places
	#inside NPS firewall
	auth = YAML.load(File.open('places_auth.yaml'))
	@consumer=OAuth::Consumer.new auth['consumer_key'], 
                                  auth['consumer_secret'], 
                                  {:site=>"http://10.147.153.193:8000/"}
	# Create the access_token for all traffic
	return OAuth::AccessToken.new(@consumer, auth['token'], auth['token_secret']) 
end
 
def add
	osm_changeset_payload = '<osm><changeset><tag k="created_by" v="res_test_rync"/><tag k="comment" v="testing"/></changeset></osm>'
	cid = @access_token.put('/api/0.6/changeset/create', osm_changeset_payload, {'Content-Type' => 'text/xml' }).body
	puts cid
	osm_addnode_payload = '<osm><node changeset="' + cid + '" lat="61.20503" lon="-149.91694"><tag k="note" v="Just a node"/><tag k="highway" v="traffic_signals"/></node></osm>'
	puts osm_addnode_payload
	resp = @access_token.put('/api/0.6/node/create', osm_addnode_payload, {'Content-Type' => 'text/xml' }).body
	puts "Node Create Response\n" + resp
	@access_token.put('/api/0.6/changeset/' + cid + '/close')
	puts 'Closed Changeset'
end

def getnode(id)
	node = @access_token.get('/api/0.6/node/'+id).body
	puts "Get Node " + id + " Response\n" + node
	node
end

def fixnode(node,cid)
    node.sub(/changeset="\d+"/, "changeset=\"#{cid}\"")
end

def deleteNode(node,cid)
    node.sub(/changeset="\d+"/, "changeset=\"#{cid}\"")
end

def update(id)
	osm_changeset_payload = '<osm><changeset><tag k="created_by" v="res_test_rync"/><tag k="comment" v="testing"/></changeset></osm>'
	cid = @access_token.put('/api/0.6/changeset/create', osm_changeset_payload, {'Content-Type' => 'text/xml' }).body
	puts 'Opened Changeset #'+cid
	node = getnode(id)
	osm_update_payload = fixnode(node,cid).sub('Just a node','My modified node')
	path = '/api/0.6/node/'+id
	puts 'PUT ' + path
	puts "body: \n" + osm_update_payload
	resp = @access_token.put(path, osm_update_payload, {'Content-Type' => 'text/xml' }).body
	puts "Node Update Response\n" + resp
	@access_token.put('/api/0.6/changeset/' + cid + '/close')
	puts 'Closed Changeset'
end

def delete(id)
	osm_changeset_payload = '<osm><changeset><tag k="created_by" v="res_test_rync"/><tag k="comment" v="testing"/></changeset></osm>'
	cid = @access_token.put('/api/0.6/changeset/create', osm_changeset_payload, {'Content-Type' => 'text/xml' }).body
	puts "Opened Changeset #{cid}"
	node = getnode(id)
	osm_delete_payload = fixnode(node,cid)
	path = '/api/0.6/node/'+id
	puts 'DELETE ' + path
	puts "body: \n" + osm_delete_payload
	#resp = @access_token.delete(path, osm_delete_payload, {'Content-Type' => 'text/xml' }).body
	resp = @access_token.request(:delete, path, osm_delete_payload, {'Content-Type' => 'application/xml' }).body
	puts "Node Delete Response\n" + resp
	@access_token.put('/api/0.6/changeset/' + cid + '/close')
	puts "Closed Changeset #{cid}"
end


nid = "3"
@access_token = test_local()
#puts fixnode(getnode(nid),"345678")
#add
#update(nid)
delete(nid)