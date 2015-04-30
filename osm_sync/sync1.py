# requests_oauthlib is needed
# sudo easy_install pip
# install requests requests_oauthlib


from requests_oauthlib import OAuth1Session
import xml.etree.ElementTree as ET

# Before accessing resources you will need to obtain a few credentials from your provider
# (i.e. OSM) and authorization from the user for whom you wish to retrieve resources for.
# You can see an example of this workflow in sync1.rb.

secrets = {
  'consumer_key': '75lESMsS2yhggNkT3haa63VwXDkdSg332G3er6JD',
  'consumer_secret': 'RDcGpLhwmsoOfP0sCXRVv0tK0dsI8XAwOrJJCxPl',
  'token': 'KPtzprdFFF01xSWBUsCdG7rPACeMVjb3ImGCtP4G',
  'token_secret': 'fngqrjVXPFCQSscSfUD6Bk9vdga5oE16M6qPwhK6'
}


def setupLocal():
  req = OAuth1Session(secrets['consumer_key'],
                      client_secret=secrets['consumer_secret'],
                      resource_owner_key=secrets['token'],
                      resource_owner_secret=secrets['token_secret'])
  url = "http://localhost:3000"
  return (req,url)


def getnode(req,root,id):
    resp = req.get(root+'/api/0.6/node/'+id)
    print "Get Node " + id + " Status: ",resp.status_code
    print "Get Node " + id + " Response:\n",resp.text
    return resp.text


def fixnode(node_string,cid,newtags = {}):
    node_xml = ET.fromstring(node_string)
    for node in node_xml.findall('node'):
        node.set('changeset',cid)
        tags = node.findall('tag')
        for k in newtags:
            absent = True
            for tag in tags:
                if tag.attrib['k'] == k:
                    absent = False
                    tag.set('v', newtags[k])
            if absent:
            	newtag = ET.SubElement(node, 'tag')
                newtag.set('k', k)
                newtag.set('v', newtags[k])
    return ET.tostring(node_xml)


#def deleteNode(node,cid):
#    node.sub(/changeset="\d+"/, "changeset=\"#{cid}\"")
#    return node


def add(req,root):
    osm_changeset_payload = '<osm><changeset><tag k="created_by" v="res_test_rync"/><tag k="comment" v="testing"/></changeset></osm>'
    resp = req.put(root+'/api/0.6/changeset/create', data=osm_changeset_payload, headers={'Content-Type': 'text/xml'})
    if resp.status_code <> 200:
        print "failed to open changeset", resp.status_code, resp.text
    else:
        cid = resp.text
        print cid
        print "Opened Changeset #",cid
        osm_addnode_payload = '<osm><node changeset="' + cid + '" lat="61.2051" lon="-149.917"><tag k="note" v="Just a python node"/><tag k="highway" v="traffic_signals"/></node></osm>'
        print osm_addnode_payload
        resp = req.put(root + '/api/0.6/node/create', data=osm_addnode_payload, headers={'Content-Type': 'text/xml'})
        print "Create Node Status:",resp.status_code
        print "Create Node Body:\n",resp.text
        req.put(root+'/api/0.6/changeset/' + cid + '/close')
        print 'Closed Changeset #'+cid


def update(req,root,id):
    osm_changeset_payload = '<osm><changeset><tag k="created_by" v="res_test_rync"/><tag k="comment" v="testing"/></changeset></osm>'
    resp = req.put(root+'/api/0.6/changeset/create', data=osm_changeset_payload, headers={'Content-Type': 'text/xml'})
    if resp.status_code <> 200:
        print "failed to open changeset", resp.status_code, resp.text
    else:
        cid = resp.text
        print "Opened Changeset #",cid
        node = getnode(req,root,id)
        osm_update_payload = fixnode(node,cid,{'note':'My modified node', 'junk':'more junk'})
        path = root+'/api/0.6/node/'+id
        print 'PUT',path
        print "Update Node Payload\n",osm_update_payload
        resp = req.put(path, data=osm_update_payload, headers={'Content-Type': 'text/xml'})
        print "Update Node Status:",resp.status_code
        print "Update Node Body:\n",resp.text
        req.put(root+'/api/0.6/changeset/' + cid + '/close')
        print 'Closed Changeset #'+cid


def delete(req,root,id):
    osm_changeset_payload = '<osm><changeset><tag k="created_by" v="res_test_rync"/><tag k="comment" v="testing"/></changeset></osm>'
    resp = req.put(root+'/api/0.6/changeset/create', data=osm_changeset_payload, headers={'Content-Type': 'text/xml'})
    if resp.status_code <> 200:
        print "failed to open changeset", resp.status_code, resp.text
    else:
        cid = resp.text
        print "Opened Changeset #",cid
        node = getnode(req,root,id)
        osm_delete_payload = fixnode(node,cid)
        path = root+'/api/0.6/node/'+id
        print 'DELETE',path
        print "Delete Node Payload\n",osm_delete_payload
        resp = req.delete(path, data=osm_delete_payload, headers={'Content-Type': 'text/xml'})
        print "Delete Node Status:",resp.status_code
        print "Delete Node Body:\n",resp.text
        req.put(root+'/api/0.6/changeset/' + cid + '/close')
        print 'Closed Changeset #'+cid


r,root = setupLocal()
#print root
#print r

#add(r,root)
#update(r,root,"2")
delete(r,root,"2")
