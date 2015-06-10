# requests_oauthlib is needed
# sudo easy_install pip
# sudo pip install requests requests_oauthlib
# on windows:
#   c:\python27\ArcGIS10.3\Scripts\pip install requests_oauthlib


from requests_oauthlib import OAuth1Session
import xml.etree.ElementTree as ET

# Before accessing resources you will need to obtain a few credentials from your provider
# (i.e. OSM) and authorization from the user for whom you wish to retrieve resources for.
# You can see an example of this workflow in sync1.rb.
# For testing, these credentials are cached in the secrets file
from secrets import *


def setup(site):
    url = secrets[site]['url']
    client_token = secrets[site]['consumer_key']
    client_secret = secrets[site]['consumer_secret']
    access_token = secrets[site]['token']
    access_secret = secrets[site]['token_secret']
    if not access_secret:
        # get request token
        request_url = url + '/oauth/request_token'
        oauth = OAuth1Session(client_token, client_secret=client_secret)
        fetch_response = oauth.fetch_request_token(request_url)
        request_token = fetch_response['oauth_token']
        request_secret = fetch_response['oauth_token_secret']

        # authorize
        verifier = secrets[site]['verifier']
        oauth = OAuth1Session(client_token,
                              client_secret=client_secret,
                              resource_owner_key=request_token,
                              resource_owner_secret=request_secret,
                              verifier=verifier)

        # get access tokens
        access_url = url + '/oauth/access_token'
        fetch_response = oauth.fetch_access_token(access_url)
        access_token = fetch_response['oauth_token']
        access_secret = fetch_response['oauth_token_secret']

        # cache access_tokens

    oauth = OAuth1Session(client_token,
                          client_secret=client_secret,
                          resource_owner_key=access_token,
                          resource_owner_secret=access_secret)
    return oauth, url


def openchangeset(oauth, root):
    cid = None
    osm_changeset_payload = '<osm><changeset>' +\
                            '<tag k="created_by" v="npsarc2osm"/>' +\
                            '<tag k="comment" v="testing"/>' +\
                            '</changeset></osm>'
    resp = oauth.put(root+'/api/0.6/changeset/create', data=osm_changeset_payload, headers={'Content-Type': 'text/xml'})
    if resp.status_code != 200:
        print "failed to open changeset", resp.status_code, resp.text
    else:
        cid = resp.text
        print "Opened Changeset #", cid
    return cid


def uploadchangeset(oauth, root, cid, change):
    data = None
    path = root+'/api/0.6/changeset/' + cid + '/upload'
    print 'POST', path
    resp = oauth.post(path, data=change, headers={'Content-Type': 'text/xml'})
    if resp.status_code != 200:
        print "Failed to upload changeset", resp.status_code, resp.text
    else:
        data = resp.text
        print "Uploaded Changeset #", cid
        # print "response",data
    return data


def closechangeset(oauth, root, cid):
    oauth.put(root+'/api/0.6/changeset/' + cid + '/close')
    print 'Closed Changeset #', cid


def fixchangefile(cid, infile):
    i = 'changeset="-1"'
    o = 'changeset="' + cid + '"'
    with open(infile, 'r') as f:
        data = f.read().replace(i, o)
    return data


def makeidmap(idxml, uploadfile):
    placesids = {}
    root = ET.fromstring(idxml)
    if root.tag != "diffResult":
        return None
    for child in root:
        placesids[child.attrib['old_id']] = child.attrib['new_id']
    gisids = {}
    root = ET.parse(uploadfile).getroot()
    # this must be a valid osmChange file, or we wouldn't get this far, so proceed
    for child in root[0]:
        tempid = child.attrib['id']
        for tag in child:
            if tag.attrib['k'] == 'nps:source_id':
                gisids[tempid] = tag.attrib['v']
    resp = "PlaceId,GEOMETRYID\n"
    for tempid in gisids:
        resp += placesids[tempid] + "," + gisids[tempid] + "\n"
    return resp


def main():
    oauth, root = setup('local')
    infile = './test_POI.osm'
    outfile = './test_POI_ids.csv'
    cid = openchangeset(oauth, root)
    if cid:
        resp = uploadchangeset(oauth, root, cid, fixchangefile(cid, infile))
        closechangeset(oauth, root, cid)
        if resp:
            idmap = makeidmap(resp, infile)
            if idmap:
                with open(outfile, 'w') as f:
                    f.write(idmap)


if __name__ == '__main__':
    main()
