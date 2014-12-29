#NPP <-> POI WorkFlow

This is an exploration of potential workflows for keeping Places and POI synchronized.
To avoid confusion the following terms are used consitently

* __NPP__

    NP Places an OSM like crowd source database of features to be used in maps on nps.gov.
    It contains locations of items across the nation, not just in Alaska.  NPP as used
    in this document refers to just the subset of features in Alaska.
    
* __POI__

    Alaska Region Places of Interest, an enterprise geodatabase of all places
    of interest in Alaska.  Selected features are approved on a park by park basis
    for public release. 

Since POI is the approved datasource for Alaska, NPP needs to either

1. Disable editing in Alaska and stay synced with POI
2. Implement a flag on all features/changes to designate the approval status that all tools will honor.
3. Ensure that all tools that pull from NPP ignore changes since the last sync with POI.

##Option 1
I'm assuming Option 1 is neither possible nor desired.

##Option 2

### Work Flow Starting points


1) AKR makes changes to `POI_PT`

* DB trigger logs changes in `POI_PT_ChangeLog_For_NPPlaces`

2) AKR periodically reviews open issues in `POI_PT_ChangeRequest_For_NPPlaces`

* Action on a change request is logged in `POI_PT_ChangeRequestAction_For_NPPlaces` (An open change request is one without a related Change Request Action)
* Action may result in a change to POI_PT (see item 1 above)

3) Places user edits feature
  * If the user is trying to edit the AKR_* attributes, reject that part of the change
  * If the feature is a point within AKR, then 
    + new features:
        - Submit change request to AKR (SR#1) and receive a Request_Id
      - Save Request_Id in the AKR_Request_Id attribute
        ~ If the request fails, then place the sentinal "Pending" (-1) in AKR_Request_Id, and archive the request body in AKR_Request_JSON
      - Set AKR_Approved_State to some sentinal value to indicate that this feature is new (i.e. it does not have an approved state)
    + Delete existing Feature with AKR_Request_Id
      - Alert the user that multiple change requests are not supported
        ~ Suggest workaround (revert the feature to the AKR_Approved_State, and then delete) to user
      - Abort delete
    + Delete existing feature (without AKR_Request_Id):
        - Submit change request to AKR (SR#1) and receive a Request_Id
      - Save Request_Id in the AKR_Request_Id attribute
        ~ If the request fails, then place the sentinal "Pending" (-1) in AKR_Request_Id, and archive the request body in AKR_Request_JSON
      - Set AKR_Approved_State to the undeleted state (or some "still alive" sentinal)
    + Change (Name, Type, Geometry) of existing Feature with AKR_Request_Id
      - Alert the user that multiple change requests are not supported
        ~ Suggest workaround (revert the feature to the AKR_Approved_State, and then make new edits) to user
      - Abort changes to (Name, Type, Geometry)
    + Change (Name, Type, Geometry) of existing feature (without AKR_Request_Id):
      - Submit change request to AKR (SR#1) and receive a Request_Id
      - Save Request_Id in the AKR_Request_Id attribute
        ~ If the request fails, then place the sentinal "Pending" (-1) in AKR_Request_Id, and archive the request body in AKR_Request_JSON
      - Set AKR_Approved_State to the unedited state
  * Make the requested edits

4) Places user reverts feature to approved state
  * if feature has no AKR_Request_Id or no AKR_Approved_State, then abort
  * Revert the feature to the AKR_Approved_State and clear AKR_Approved_State
  * if AKR_Request_Id is "Cancel Pending" (-2) then abort
  * if AKR_Request_Id is "Pending" (-1), then clear AKR_Request_Id
  * Otherwise
    + submit cancel change request (SR#1)
      - for id, use AKR_Feature_Id if it exists, otherwise use the NP_Places_Id
      - If the request fails, then place the sentinal "Cancel Pending" (-2) in AKR_Request_Id, and archive the request body in AKR_Request_JSON
      - If the request succeeds, clear AKR_Request_Id
  
5) Places system sync event (periodically run as cron job)
  * Check on outstanding requests by finding all features (including deleted) in Places with an AKR_Request_Id
    + If the id is 'Cancel Pending' (-2) then resubmit the change request (SR#1)
      - the body of the change request is archived in AKR_Request_JSON
      - if the submit succeeds, then clear AKR_Request_JSON and AKR_Request_Id
    + If the id is 'Pending' (-1) then resubmit the change request (SR#1)
      - the body of the change request is archived in AKR_Request_JSON
      - if the submit succeeds, then clear AKR_Request_JSON and save the returned request_Id in AKR_Request_Id
    + For other non-null ids, get the status of the change request (SR#2)
      - If the status is 'denied'
        ~ optional: create new attribute with denied comment and the requested state
        ~ revert the feature to the state pointed to by AKR_Approved_State
        ~ clear the AKR_Request_Id and AKR_Approved_State
      - If the status is 'approved', Clear the AKR_Request_Id and AKR_Approved_State (feature will be updated in the next step)
      - If the status is 'partially approved' treat as denied  (feature will be updated in the next step)
      - Status should not be 'cancelled', but if it is, treat as denied
      - If the status is open (i.e. no related actions), then no action is required.
  * Incorporate AKR changes
    + Get the list of Feature Ids for all adds/deletes/updates since the last sync from the ChangeLog Service (SR#3)
    + For each AKR_Feature_Id in 'adds'
      - get the features new properties (SR#4)
      - if the feature has a Places ID (it originated in Places)
        ~ find the features in Places
        ~ update the AKR_Feature_Id
        ~ It had a AKR_Request_Id when it was created, so it is unlikely that there is a new change on the feature since it was approved 
      - otherwise, create a new feature in Places
    + For each AKR_Feature_Id in 'deletes'
      - find the features in Places
      - the feature may already be deleted if this delete is in response to a request from Places
      - if the feature has an AKR_Request_Id, then update the AKR_Approved_State to deleted
      - otherwise, 'delete' the feature.
    + For each AKR_Feature_Id in 'updates'
      - get the features new properties (SR#4)
      - if the feature has an AKR_Request_Id, then update the AKR_Approved_State with the new properties
      - otherwise, update the current state of the feature to the new properties 


### NPP Should
  * Symbolize (or somehow identify) any feature with an AKR_Approved_State (and/or AKR_Request_Id) that the current state (Type, Name, Geometry) is not approved
  * Provide the user with the ability to see the AKR_Approved_State
  * Provide the user with the ability to revert a feature to the AKR_Approved_State

### NPP Must
  * Use the AKR_Approved_State (when present) when deriving products (i.e Park Tiles)

### Special attributes

These attributes will be added to NPP features as described above. 
They should be a system attributes, or at least hidden from the user to prevent data corruption

  * `AKR_Request_Id` - It will be a 32bit signed int (limit 2e9 changes)
  * `AKR_Approved_State` is a tuple of (Type, Name, and Geometry), all other Places attributes are free to change without AKR approval
  * `AKR_Feature_Id` is a GUID string
  * `AKR_Request_JSON` is text formated as the JSON body for SR#1, saved to resubmit when the original POST failed.

### Services
The following HTTP end points will be provided by AKR to support the workflow above

####SR#1
`POST poi/request`

Request body:

    {
        'requestor': <name/id of requestor>,
        'operation': <one of 'add', 'delete', 'update', 'cancel'>
        'feature' : {
            'id' : <The NP Places ID for adds, and the AKR feature ID for all others>,
            'name' : <name as text>,
            'type' : <type as tex>,
            'geometry : <esri JSON geometry object>
        }
    }

`feature` does not require all the attributes shown.
When the operation is `delete` only an `AKR_Feature_Id` is required.
`cancel` requires the id (AKR or NP Places) provided with the original request.
`add` requires `NP_Places_feature_id`, `name`, `type`, and `geometry`.
`update` requires an `AKR_Feature_Id`, and one or more of `name`, `type`, `geometry`.

Response:

    201 Created
        {'id' : <newly created request_id>}
    403 Forbidden
        {'code' : 200, 'error' : 'Missing Request Key', 'msg' : <varies>}
        {'code' : 201, 'error' : 'Missing Request Value', 'msg' : <varies>}
        {'code' : 202, 'error' : 'Invalid Request Value', 'msg' : <varies>}
    500 Internal Server Error
        {'code' : 300, 'error' : 'Database Error', 'msg' : <varies> }         

####SR#2
`GET poi/request/<request_id>`

Response:

    200 OK
        {'status'  : <one of 'open', 'approved', 'partially approved', 'denied', 'cancelled'>,
         'comment' : <optional text explaining denial or partial approval>}
    404 Not Found
    500 Internal Server Error
        {'code' : 300, 'error' : 'Database Error', 'msg' : <varies> }         
    
####SR#3
`GET poi/changes?since=iso-date`

Response:

    200 OK
        {'adds'    : ['id1',...],
         'deletes' : ['id1',...],
         'updates' : ['id1',...]}
    403 Forbidden
        {'code' : 101, 'error' : 'Invalid parameter', 'msg' : 'Not a valid date'} 
    500 Internal Server Error
        {'code' : 300, 'error' : 'Database Error', 'msg' : <varies> }         

The lists contain AKR_Feature_Ids.

####SR#4
`GET poi/feature/<AKR_Feature_Id>`

Response:

    200 OK
        {'id'      : <The NP Places ID if one exists>,
         'name'    : <name as text>,
         'type'    : <type as text>,
         'geometry : <esri JSON geometry object>}
    404 Not Found
    500 Internal Server Error
        {'code' : 300, 'error' : 'Database Error', 'msg' : <varies> }         
    

##Option 3

NPP only maintains features that come from POI.
Edits in NPP are temporary and are deleted once they are submitted to POI.
Tools that pull from NPP must ignore changes since the last sync with POI.

With option 3 NPP users should to be notified that edits in Alaska are mearly requests
for changes, and once submitted will be deleted from NPP until the change is accepted.
NPP users should contact AKR GIS to check the disposition of a change request.
nps.gov/parktiles should ignore any changesets created since the last sync with POI

###Initial Data Load
* Export all NPP features in Alaska
* Submit these features to AKR for review and potential inclusion in POI
* Delete all Alaska features from NPP
* Create new features in NPP from the POI feature service

###Periodic Sync
Run a regularly scheduled process to check for changes to the POI feature service.

* Submit all user changesets in NPP since the last sync to POI for review.
    - For all features without an ObjectID, submit those to POI as a potential new feature
    - For all deleted features with an objectId, submit a _delete ObjectId_ request to POI
    - For all other changes (updates), submit those to POI by ObjectId
* Clear (or rewind) all user changesets since the last sync.
* Search for features in POI that have a Edit_By date more recent than the the last sync
    - For each feature found, search NPP for a feature with the same ObjectId
    - If one exists, then update with the new location/attribution
    - If none exists, then create a new feature.
* Check the POI feature count, and compare with the feature count in NPP
    - If POI has fewer features than NPP, then a feature has been deleted.
    - Get a list of all ObjectIds in POI
    - Remove any feature in NPP with an ObjectID not in the list
* As an alternative to the last three steps, a simple bulk delete and replace strategy could be used.
* Cache the datetime of this sync to be used during the next sync
* All changes to NPP that occur during the sync should be flagged as system changes, so
  that they can be distinguished from changes made by ordinary users

####Issues:
Creating/changing a feature, and then having the feature/change disappear will be
very confusing to NPP users.  They should be forewarned, and notified that the preference
is to edit the primary databases in AKR.  If they choose to edit NPP, they should check
with AKR to see the status of thier changes.
