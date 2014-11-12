#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Sample code for editing an ArcGIS Feature Service with the REST API.

Testing the ArcGIS Feature Service REST API
http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r3000000z2000000
"""

from __future__ import print_function
import json
import urllib2
import urllib

url = 'http://inpakrovmais:6080/arcgis/rest/services/Places_Editable/FeatureServer/0/'

# Delete Example (POST only)
def delete(objectIds):
    # http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Delete_Features/02r3000000w4000000/
    # However, delete should just update the 'Include_in_NPSPlaces' to 'N' and 'Edit_By' to Places User

    objectIdString = '%2C'.join([str(id) for id in objectIds])
    query_args = {'objectIds' : objectIdString, 'f' : 'json'}
    postData = urllib.urlencode(query_args)
    #print(postData)
    response = urllib2.urlopen(url + 'deleteFeatures', postData)
    if response.getcode() != 200:
        print('Unexpected Server Response', response.getcode(), response.info())
    else:
        respData = json.load(response)
        print(str(respData))

    
# Add Example (POST only)
def add(lat, lon, type, name, owner):
    # http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Add_Features/02r30000010m000000/
    geometry = {'x' : lon, 'y' : lat, 'spatialReference' : {'wkid' : 4326}}
    # The Edit_By field will automatically receive 'Esri_Anonymous',
    # and the Edit_date field will get the date automatically.
    # Create_By and Create_Date are not autopopulated for this dataset.
    date = (datetime.datetime.utcnow() - datetime.datetime.utcfromtimestamp(0)).total_seconds() * 1000.0
    attributes = {'Place_Name' : name, 'Place_Type' : type, 'Create_By' : owner, 'Create_Date' : date}
    feature = {'geometry' : geometry, 'attributes' : attributes}
    features = [feature]
    query_args = {'features' : json.dumps(features), 'f' : 'json'}
    postData = urllib.urlencode(query_args)
    #print(postData)
    response = urllib2.urlopen(url + 'addFeatures', postData)
    newId = None
    if response.getcode() != 200:
        print('Unexpected Server Response', response.getcode(), response.info())
    else:
        respData = json.load(response)
        try:
            if respData['addResults'][0]['success']:
                newId = respData['addResults'][0]['objectId']
            else:
                print("Add failed", respData['addResults'][0]['error'])
        except KeyError:
            print("Unexpected response from server",respData)
    return newId


    
# Update Example
def updateLocation(id, lat, lon, owner):
    # http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Update_Features/02r3000000zt000000/
    geometry = {'x' : lon, 'y' : lat, 'spatialReference' : {'wkid' : 4326}}
    # Argh!, the Edit_By field will automatically receive 'Esri_Anonymous' even if I specify a value
    attributes = {'OBJECTID' : id, 'Edit_By' : owner }
    feature = {'geometry' : geometry, 'attributes' : attributes}
    features = [feature]
    query_args = {'features' : json.dumps(features), 'f' : 'json'}
    postData = urllib.urlencode(query_args)
    #print(postData)
    response = urllib2.urlopen(url + 'updateFeatures', postData)
    if response.getcode() != 200:
        print('Unexpected Server Response', response.getcode(), response.info())
    else:
        respData = json.load(response)
        try:
            if respData['updateResults'][0]['success']:
                return True
            else:
                print("Update failed", respData['updateResults'][0]['error'])
        except KeyError:
            print("Unexpected response from server",respData)
    return False


def updateName(id, name, owner):
    # http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Update_Features/02r3000000zt000000/
    # Argh!, the Edit_By field will automatically receive 'Esri_Anonymous' even if I specify a value
    attributes = {'OBJECTID' : id, 'Place_Name' : name, 'Edit_By' : owner }
    feature = {'attributes' : attributes}
    features = [feature]
    query_args = {'features' : json.dumps(features), 'f' : 'json'}
    postData = urllib.urlencode(query_args)
    #print(postData)
    response = urllib2.urlopen(url + 'updateFeatures', postData)
    if response.getcode() != 200:
        print('Unexpected Server Response', response.getcode(), response.info())
    else:
        respData = json.load(response)
        try:
            if respData['updateResults'][0]['success']:
                return True
            else:
                print("Update failed", respData['updateResults'][0]['error'])
        except KeyError:
            print("Unexpected response from server",respData)
    return False


#delete([1737])
#newId = add(64.6678, -152.9, "Hiking Trail", "Denali Ridge3", "regan")
#print("added new Feature", newId)
#updateLocation(1738, 64.4, -152.5, "regan")
updateName(1738, "Denali Valley", "george")