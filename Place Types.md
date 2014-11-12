
#Discussion of Place Types

##Place Type Crosswalk

NP Places      | AKR POI
---------------|--------------------
Campground     | Campground
Food service   | na
Picnic Area    | Picnic Area
Information    | na
Parking        | na 
Visitor Center | Visitor Information
Ranger Station | Ranger Station
Trailhead      | Hiking Trail
Lodging        | Lodging
Store          | na


##AKR Places of Interest Database

###Place Type Domain Values

* Airport
* Administrative Building
* Boat Anchorage
* Boat Ramp
* Campground
* Concessions
* Cultural Landscape
* Exhibit
* Ferry
* Fire
* Fuel
* Hiking Trail
* Learning Center
* Landing Strip
* Lodging
* Maintenance
* Museum
* National Historic Landmark
* National Natural Landmark
* National Register Historic Place
* Picnic Area
* Primitive Campground
* Public Cabin
* Ranger Station
* Restroom
* Seaplane Anchorage
* Seaplane Base
* Shelter
* Small Boat Harbor
* Storage
* Vista Overlook
* Visitor Information
* Other

## NP Places - Point Types

###Default point feature types
Based on the behavior of the ID editor in October 2014.
Default attribute set listed in parentheses

* Campground (1)
* Food service (1)
* Picnic Area (1,2,3,5)
* Information (1,2,3, an optional sub type can be one of the following:)
    - board
    - guidepost
    - map
    - office
    - trail blaze
    - terminal
    - route marker
    - audioguide
    - tactile model
    - tactile map
* Parking (1,2,3,6,7,8,9,10, an optional sub type can be one of the following:)
    - surface
    - multilevel
    - underground
    - sheds
    - carports
    - garage boxes
    - roadside lane
* Visitor Center (1)
* Ranger Station (1,2,3,4)
* Trailhead (1)
* Lodging (1,2,3,5)
* Store (1)
* Point (1)

###Default attributes
presented in the editing form when a feature type is selected

1. name (freetext, can also include any number of translations (language (picklist), freetext))
2. operator (free text)
3. address (number, street, city, postal code)
4. hours (free text)
5. smoking (picklist:yes,no,outside,separated,isolated,dedicated)
6. capacity (number)
7. fee (yes,no,unknown)
8. access (picklist:permissive(yes),no,private,customers)
9. supervised (yes,no,unknown)
10. park and ride (yes,no,unknown)

###Optional Attributes
All features have a GUI interface for adding the following optional attributes

* address (number, street, city, postal code)
* elevation (number)
* note (long freetext)
* phone (freetext)
* source (freetext)
* website (url)
* wheel chair accessibility (picklist: yes, no, limited)
* wikipedia reference (language, url)


