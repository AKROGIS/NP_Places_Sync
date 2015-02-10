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


1) AKR makes changes to `POI_PT` feature class

* A database trigger logs changes in `POI_PT_ChangeLog_For_NPPlaces` table
  - Interested clients can review the changes via [SR#3](#sr3)

2) AKR periodically reviews open issues in `POI_PT_ChangeRequest_For_NPPlaces`

* A client can submit a change request via [SR#1](#sr1)
* Action on a change request is logged in `POI_PT_ChangeRequestAction_For_NPPlaces` table
  - An open change request is one without a related Change Request Action
* Action may result in a change to POI_PT (see item 1 above)

3) Places user edits feature
  * If the user is trying to edit the AKR_* attributes, reject that part of the change
  * If the feature is a point within AKR, then 
    + new features:
        - Submit change request to AKR via [SR#1](#sr1) and receive a *Request_Id*
      - Save *Request_Id* in the `AKR_Request_Id` attribute
        * If the request fails, then place the sentinal `-1` (Pending) in `AKR_Request_Id`, and archive the request body in `AKR_Request_JSON`
      - Set `AKR_Approved_State` to some sentinal value to indicate that this feature is new (i.e. it does not have an approved state)
    + Delete existing Feature with `AKR_Request_Id`
      - Alert the user that multiple change requests are not supported
        * Suggest workaround (revert the feature to the `AKR_Approved_State`, and then delete) to user
      - Abort delete
    + Delete existing feature (without `AKR_Request_Id`):
        - Submit change request to AKR via [SR#1](#sr1) and receive a *Request_Id*
      - Save *Request_Id* in the `AKR_Request_Id` attribute
        * If the request fails, then place the sentinal `-1` (Pending) in `AKR_Request_Id`, and archive the request body in `AKR_Request_JSON`
      - Set `AKR_Approved_State` to the undeleted state (or some "still alive" sentinal)
    + Change (Name, Type, Geometry) of existing Feature with `AKR_Request_Id`
      - Alert the user that multiple change requests are not supported
        * Suggest workaround (revert the feature to the `AKR_Approved_State`, and then make new edits) to user
      - Abort changes to (Name, Type, Geometry)
    + Change (Name, Type, Geometry) of existing feature (without `AKR_Request_Id`):
      - Submit change request to AKR (SR#1) and receive a *Request_Id*
      - Save *Request_Id* in the `AKR_Request_Id` attribute
        * If the request fails, then place the sentinal `-1` (Pending) in `AKR_Request_Id`, and archive the request body in `AKR_Request_JSON`
      - Set `AKR_Approved_State` to the unedited state
  * Make the requested edits

4) Places user reverts feature to approved state
  * if feature has no `AKR_Request_Id` or no `AKR_Approved_State`, then abort
  * Revert the feature to the `AKR_Approved_State` and clear `AKR_Approved_State`
  * if `AKR_Request_Id` is `-2` (Cancel Pending) then abort
  * if `AKR_Request_Id` is `-1` (Pending), then clear `AKR_Request_Id`
  * Otherwise
    + submit cancel change request via [SR#1](#sr1)
      - for id, use `AKR_Feature_Id` if it exists, otherwise use the *NP_Places_Id*
      - If the request fails, then place the sentinal `-2` (Cancel Pending) in `AKR_Request_Id`, and archive the request body in `AKR_Request_JSON`
      - If the request succeeds, clear `AKR_Request_Id`
  
5) Places system sync event (periodically run as cron job)
  * Check on outstanding requests by finding all features (including deleted) in Places with an `AKR_Request_Id`
    + If the id is `-2` (Cancel Pending) then resubmit the change request via [SR#1](#sr1)
      - the body of the change request is archived in `AKR_Request_JSON`
      - if the submit succeeds, then clear `AKR_Request_JSON` and `AKR_Request_Id`
    + If the id is `-1` (Pending) then resubmit the change request via [SR#1](#sr1)
      - the body of the change request is archived in `AKR_Request_JSON`
      - if the submit succeeds, then clear `AKR_Request_JSON` and save the returned request_Id in `AKR_Request_Id`
    + For other non-null ids, get the status of the change request via [SR#2](#sr2)
      - If the status is `denied`
        * optional: create new attribute with denied comment and the requested state
        * revert the feature to the state pointed to by `AKR_Approved_State`
        * clear the `AKR_Request_Id` and `AKR_Approved_State`
      - If the status is `approved`, Clear the `AKR_Request_Id` and `AKR_Approved_State` (feature will be updated in the next step)
      - If the status is `partially approved` treat as denied  (feature will be updated in the next step)
      - Status should not be `cancelled`, but if it is, treat as denied
      - If the status is open (i.e. no related actions), then no action is required.
  * Incorporate AKR changes
    + Get the list of feature `id`s for all `adds`/`deletes`/`updates` since the last sync via [SR#3](#sr3)
    + For each `id` in `adds`
      - get the features new properties via [SR#4](#sr4)
      - if the feature has a Places ID (i.e. it originated in Places)
        * find the features in Places
        * update the `AKR_Feature_Id`
        * It had a `AKR_Request_Id` when it was created, so it is unlikely that there is a new change on the feature since it was approved
        * __ISSUE__ if AKR partially approves the add (i.e. an add with changes), then I'm unsure how we should handle this.
          AKR can eliminate the problem by doing an add, then an update        
      - otherwise, create a new feature in Places
    + For each `id` in `updates`
      - get the features new properties via [SR#4](#sr4)
      - if the feature has an `AKR_Request_Id`, then update the `AKR_Approved_State` with the new properties
      - otherwise, update the current state of the feature to the new properties 
    + For each `id` in `deletes`
      - find the features in Places
      - the feature may already be deleted if this delete is in response to a request from Places
      - if the feature has an `AKR_Request_Id`, then update the `AKR_Approved_State` to deleted
      - otherwise, 'delete' the feature.
    + Adds, updates, deletes must be applied in this order. For example the same feature maybe created then updated or updated then deleted.
      These operations in the opposite order make no sense.

### NPP Should
  * Symbolize (or somehow identify) any feature with an `AKR_Approved_State` (and/or `AKR_Request_Id`) that the current state (Type, Name, Geometry) is not approved
  * Provide the user with the ability to see the `AKR_Approved_State`
  * Provide the user with the ability to revert a feature to the `AKR_Approved_State`

### NPP Must
  * Use the `AKR_Approved_State` (when present) when deriving products (i.e Park Tiles)

### Special attributes

These attributes will be added to NPP features as described above. 
They should be a system attributes, or at least hidden from the user to prevent data corruption

  * `AKR_Request_Id` - It will be a 32bit signed int (limit 2e9 changes)
  * `AKR_Approved_State` is a tuple of (Type, Name, and Geometry), all other Places attributes are free to change without AKR approval
  * `AKR_Feature_Id` is a GUID string
  * `AKR_Request_JSON` is text formated as the JSON body for SR#1, saved to resubmit when the original POST failed.

### Services
The following HTTP end points will be provided by AKR to support the workflow above

####<a name="sr1">Service Request #1</a>
`POST poi/change/request`

Request body:

    {
        'requestor': <unique id of requestor (number, string, or object)>,
        'operation': <one of 'add', 'delete', 'update', 'cancel'>
        'feature' : {
            'id' : <The NP Places ID for adds, and the AKR feature ID for all others>,
            'name' : <name as text>,
            'type' : <type as tex>,
            'geometry : <esri JSON geometry object>
        }
    }
`requestor` will be used by the AKR staff to contact the requestor should a conversation be warranted.
An email would be good, but other values may work as well provided the meaning is understood. The string or
object (converted to a JSON string) is limited to 255 characters. 
`feature` does not require all the attributes shown.
When the operation is `delete` only an `AKR_Feature_Id` is required.
`cancel` requires the id (AKR or NP Places) provided with the original request.
`add` requires `NP_Places_feature_id`, `name`, `type`, and `geometry`.
`update` requires an `AKR_Feature_Id`, and one or more of `name`, `type`, `geometry`.
If the geometry does not contain a `spatialreference` property, then WGS84 (`{'wkid' : 4326}`) is assumed.
There is no limit on the size of the `feature` but the entire body must be less than 1,000,000 bytes,
or it will be rejected.

Response:

    200 OK
        {'id' : <newly created request_id (int)>}
    403 Forbidden
        {'code' : 200, 'error' : 'Malformed request body', 'msg' : <varies>}
        {'code' : 201, 'error' : 'Missing value in request body', 'msg' : <varies>}
        {'code' : 202, 'error' : 'Invalid value in request body', 'msg' : <varies>}
    500 Internal Server Error
        {'code' : 300, 'error' : 'Database error', 'msg' : <varies> }         

####<a name="sr2">Service Request #2</a>
`GET poi/change/request/<request_id>/status`

Response:

    200 OK
        {'status'  : <one of 'open', 'approved', 'partially approved', 'denied', 'cancelled'>,
         'comment' : <optional text explaining denial or partial approval>}
    404 Not Found
    500 Internal Server Error
        {'code' : 300, 'error' : 'Database error', 'msg' : <varies> }         
    
####<a name="sr3">Service Request #3</a>
`GET poi/changes?since=iso-date`

Response:

    200 OK
        {'adds'    : ['id1',...],
         'deletes' : ['id1',...],
         'updates' : ['id1',...]}
    403 Forbidden
        {'code' : 101, 'error' : 'Invalid parameter', 'msg' : 'Not a valid date'} 
    500 Internal Server Error
        {'code' : 300, 'error' : 'Database error', 'msg' : <varies> }         

The lists contain AKR_Feature_Ids.

####<a name="sr4">Service Request #4</a>
`GET poi/feature/<AKR_Feature_Id>`

Response:

    200 OK
        {'id'      : <The NP Places ID if one exists>,
         'name'    : <name as text>,
         'type'    : <type as text>,
         'geometry' : <esri JSON geometry object>}
    404 Not Found
    500 Internal Server Error
        {'code' : 300, 'error' : 'Database error', 'msg' : <varies> }         
    

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
