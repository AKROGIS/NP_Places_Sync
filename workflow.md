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
With option 2 there needs to be some mechanism for communicating the state
(approved, denied, pending) of a features created in NPP, as well as the state
of a change request to an existing feature.  For example, if a NPP user wants to change
the name of an approved feature, the original (approved) name should be used until the new
name is approved.  Tools that pull data from NPP must pull only approved
features, or the approved state of a feature before all unapproved changes.  Syncing tools
must be able to communicate not only the current state of features, but also the disposition
of all change requests, and modify features appropriately, preserving the transactions.
For example, A NPP user should be able to see that a request to change the name was
submitted, reviewed, and then denied. Option 2 seems like a very complicated choice, and isn't
persued any further.

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
