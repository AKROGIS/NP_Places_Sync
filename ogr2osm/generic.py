def filterTags(attrs):
    if not attrs:
        return
    tags = {}
 
    namemap = {
#   'PLACESID'   :Ignore
    'UNITCODE'   :'nps:unit_code',
    'UNITNAME'   :'nps:unitname',
    'GROUPCODE'  :'nps:groupcode',
    'REGIONCODE' :'nps:regioncode',
    'LOCATIONID' :'nps:locationid',
    'ASSETID'    :'nps:assetid',
    'ISEXTANT'   :'nps:isextant',
    'MAPMETHOD'  :'nps:mapmethod',
    'MAPSOURCE'  :'source',
    'SOURCESCALE':'nps:sourcescale',
    'SOURCEDATE' :'nps:sourcedate',
    'XYERROR'    :'nps:xyerror',
    'NOTES'      :'note',
    'RESTRICTION':'nps:restriction',
    'DISTRIBUTE' :'nps:distribute',
    'CREATEDATE' :'nps:createdate',
    'CREATEUSER' :'nps:createuser',
    'EDITDATE'   :'nps:editdate',
    'EDITUSER'   :'nps:edituser',
    'FEATUREID'  :'nps:featureid',
    'GEOMETRYID' :'nps:source_id'}
    
    
    
    for gis in attrs:
        if gisname in attrs:
            tags[namemap[gis]] = attrs[gis].strip()
        
        
        
    tags['source'] = 'Township of Langley GIS Data'

    return tags