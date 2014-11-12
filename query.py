#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Sample code for querying an ArcGIS Feature Service with the REST API.

The Places service has a location, and two attributes of interest (Place_Type
and Place_Name).  In addition, the OBJECTID (int32) should be maintained with
all features, as it is used by the feature service REST API as a unique identifier
for all deletes and updates."""

from __future__ import print_function
import json
import urllib2

#Get changes since a given date/time
####################################
last_check = '2014-10-31T22:00:00'
service = 'http://inpakrovmais:6080/arcgis/rest/services/Places/FeatureServer/0/query'
query = '?where=Edit_Date%3E%27' + last_check + '%27&outFields=OBJECTID%2CPlace_Type%2CPlace_Name&outSR=4326&f=json'
url = service + query

response = urllib2.urlopen(url)
#may throw URLError; undoubtedly a programming error, so just die.

if response.getcode() != 200:
    print('Server response', response.getcode(), response.info())
else:
    data = json.load(response)
    print('uid,lat,lon,type,name')
    for feature in data['features']:
        #handle features without geometry
        try:
            lat = feature['geometry']['y']
            lon = feature['geometry']['x']
        except KeyError:
            lat = None
            lon = None
        name = feature['attributes']['Place_Name']
        kind = feature['attributes']['Place_Type']
        uid = feature['attributes']['OBJECTID']
        print('{0},{1},{2},{3},{4}'.format(uid, lat, lon, kind, name))

		
#get Feature Count
##################
query = '?returnCountOnly=true&f=json'
url = service + query

response = urllib2.urlopen(url)
#may throw URLError; undoubtedly a programming error, so just die.

if response.getcode() != 200:
    print('Server response', response.getcode(), response.info())
else:
    data = json.load(response)
    try:
        print ('There are {} features in the service.'.format(data['count']))
    except KeyError:
        print ('Unexpected response.',data)
    
