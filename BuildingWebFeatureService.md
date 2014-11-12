Publishing SDE data on ArcGIS Server
====================================
These instructions are specific to the Alaska Region SDE standards

### Add Global Id
If you want to be able to edit the data offline with Collector,
the data requires a GlobalId field.

1. Open ArcCatalog
2. Double click on a **GIS Data Manager** connection. (see the KeyPass file for details on this account)
3. Select any dataset, and right click and select `Manage->Add Global Ids...`

### Create Reader Account
Using a database SA connection add the **AKR Web User (Reader)** 
and **AKR Web User (Editor)** user accounts to the database.
(See the KeyPass file for details on the these accounts)

1. Open ArcCatalog
2. Right click on the database connection and select `Administration -> Add User`
3. Enter the user and password information from KeyPass
4. Leave the `Role` and `Create Operating System Authenticated User` fields blank
5. This command is harmless if the account already exists. 

### Set Reader Permissions
Using the GIS Data Manager connection, give the **AKR Web User (Reader)** select
permissions to the appropriate feature class or spatial view.

1. Open ArcCatalog
2. Double click on a **GIS Data Manager** connection.
3. Right click on the appropriate feature class or spatial view.
4. Select `Manage->Privileges..`.
5. If **akr_reader_web** is not in the list, click Add and enter **akr_reader_web**

### Set Editor Permissions
Using the GIS Data Manager connection, give the *AKR Web User (Editor)* select,
insert, update, delete permissions to the feature class they can edit.  Note that
the base table (default) is protected, so they can only edit a version that
they own.  I do not think this will work on a spatial view.

1. In ArcCatalog
2. Double click on a **GIS Data Manager** connection.
3. Right click on the appropriate feature class.
4. Select `Manage->Privileges...`
5. If **akr_editor_web** is not in the list, click Add and enter **akr_editor_web**
6. Click in the insert check box in the akr\_editor\_web row.
7. Click OK to save the changes and close the dialog

### Create Connection Files
Create two connection to the database.
One for **AKR Web User (Reader)** and the other for **AKR Web User (Editor)**

1. Open ArcCatalog
2. Double click on `Add Database Connection`.
3. Database is `Sql Server`
4. Instance is `INPAKROVMAIS`
5. Authentication Type is `Database Authentication`
6. Enter the `AKR Web User (Reader)` username and password
7. Make suRE `Save user name and password` is checked
8. Select the SDE database and click OK
9. Give the connection file a meaningful name like {Database}\_on\_{Server}\_as\_{user}.sde

### Create an SDE version for web edits

1. Open ArcCatalog
2. Right click on an **AKR Web User (Editor)** connection.
3. Select `Administration->Administer Geodatabase...`
4. Click on the `Versions` tab
5. Right Click on `DEFAULT` in the list of versions.
6. Select `New Version`
7. Enter `Web_Edits` for the version name, and `Private` for the access level
8. Click OK and close the Administration Panel

### Fix the connection file to use the new version

1. Open ArcCatalog
2. Right click on the **AKR Web User (Editor)** connection.
3. Select `Geodatabase Connection Properties...`
4. Select the `Web_Edits` version in the transactional version list.
5. Click OK to save the changes to the connection file

### Add the connection files to ArcGIS Server.
The connection files in the previous steps
must be used to create the map documents used to publish any services.  This step
provides ArcGIS server with the database connection properties so that it can
read and write to the master database that the publisher was looking at.

1. Log into ArcGIS Server on INPAKROVMAIS as an administrator (See KeyPass)
2. Click on the `Site` tab, and select `Data Store` from the list on the left
3. Click the `Register Database` button to add a database connection file
4. Give the connection a unique name
5. Click the `Import` button to browse to the connection files you created in the previous steps.  These are typically stored in `C:\Users\{LOGIN_ID}\AppData\Roaming\ESRI\Desktop10.3\ArcCatalog`
6. The `Server database connection` is the `Same as publisher database connection`
7. Click Create
8. Repeat for the Editable version of the connection file

### Create map documents to publish

1. Drag and drop from ArcCatalog to ArcMap the feature class created above one map has the editable version, and one has the authoritive readonly view
2. ~~Set the projection of the map to WGS84\_Web\_Mercator~~ (This is not required, as the spatial reference for output or input geometry can be set through the REST API)
3. Set the symbology and Query definition as appropriate
4. Map should have only one feature layer
5. (verify) The editable feature should have all attributes and no definition query to ensure the edit process is as robust as possible.
6. Save the map

###  Publish the map documents to ArcGIS Server

1. Open ArcMap
2. Select `File->Share As->Service` from the main menu
3. Select `Publish a Service` and click `Next>`
4. Select/Create a connection (admin or publisher on inpakrovmais port 6080). See KeyPass for connection details
5. Give the Service a name and press `Next>`
6. Select a folder (or [root] for no folder)
7. ....

	
	
