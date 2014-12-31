
USE [akr_socio]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


-- Change Log
-- Grant SELECT & INSERT to GIS; no need for deletes or updates

CREATE TABLE [dbo].[POI_PT_ChangeLog_For_NPPlaces](
	[TimeStamp] [datetime2](7) NOT NULL,
	[Operation] [nvarchar](10) NOT NULL,  -- {'Insert', 'Delete', 'Update'}
	[FeatureId] [nvarchar](50) NOT NULL,  -- references GlobalId column in POI_PT (not a FK, due to deletes)
 CONSTRAINT [PK_POI_PT_ChangeLog_For_NPPlaces] PRIMARY KEY CLUSTERED 
(
	[TimeStamp] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

ALTER TABLE [dbo].[POI_PT_ChangeLog_For_NPPlaces] ADD  CONSTRAINT [DF_POI_PT_ChangeLog_For_NPPlaces_TimeStamp]  DEFAULT (getutcdate()) FOR [TimeStamp]
GO


-- Change Request
-- Grant SELECT & INSERT to Public; no need for deletes or updates

CREATE TABLE [dbo].[POI_PT_ChangeRequest_For_NPPlaces](
	[RequestId] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[TimeStamp] [datetime2](7) NOT NULL,
	[Operation] [nvarchar](10) NOT NULL,  -- {'add', 'update', 'delete', 'cancel'}
	[Requestor] [nvarchar](255) NOT NULL,  -- ?? OSM Login, AD Login, SSID, Friendly Name ??
	[FeatureJSON] [nvarchar](max) NOT NULL,
 CONSTRAINT [PK_POI_PT_ChangeRequest_For_NPPlaces] PRIMARY KEY CLUSTERED 
(
	[RequestId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO

ALTER TABLE [dbo].[POI_PT_ChangeRequest_For_NPPlaces] ADD  CONSTRAINT [DF_POI_PT_ChangeRequest_For_NPPlaces_TimeStamp]  DEFAULT (getutcdate()) FOR [TimeStamp]
GO


-- Request Action
-- Grant SELECT to Public; Grant Insert to GIS; no need for deletes or updates

CREATE TABLE [dbo].[POI_PT_ChangeRequestAction_For_NPPlaces](
	[ActionId] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[TimeStamp] [datetime2](7) NOT NULL,
	[RequestId] [int] NOT NULL,
	[Action] [nvarchar](10) NOT NULL, -- {'open', 'approved', 'partially approved', 'denied', 'cancelled'}
	[Reviewer] [nvarchar](50) NOT NULL,  -- ?? DB Login, , AD Login, SSID, Friendly Name ??
	[Comment] [nvarchar](max) NULL,
 CONSTRAINT [PK_POI_PT_ChangeRequestAction_For_NPPlaces] PRIMARY KEY CLUSTERED 
(
	[ActionId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO

ALTER TABLE [dbo].[POI_PT_ChangeRequestAction_For_NPPlaces] ADD  CONSTRAINT [DF_POI_PT_ChangeRequestAction_For_NPPlaces_TimeStamp]  DEFAULT (getutcdate()) FOR [TimeStamp]
GO

ALTER TABLE [dbo].[POI_PT_ChangeRequestAction_For_NPPlaces]  WITH CHECK ADD  CONSTRAINT [FK_POI_PT_ChangeRequestAction_For_NPPlaces_POI_PT_ChangeRequest_For_NPPlaces] FOREIGN KEY([RequestId])
REFERENCES [dbo].[POI_PT_ChangeRequest_For_NPPlaces] ([RequestId])
GO

ALTER TABLE [dbo].[POI_PT_ChangeRequestAction_For_NPPlaces] CHECK CONSTRAINT [FK_POI_PT_ChangeRequestAction_For_NPPlaces_POI_PT_ChangeRequest_For_NPPlaces]
GO


-- Insert Change Request Stored Procedure (to return auto id)
-- Grant execute permission to public

USE [akr_socio]
GO

/****** Object:  StoredProcedure [dbo].[POI_PT_ChangeRequest_For_NPPlaces_Insert]    Script Date: 12/30/2014 3:56:04 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Regan Sarwas
-- Create date: December 30, 2014
-- Description:	Adds a new request to the database.
-- =============================================
CREATE PROCEDURE [dbo].[POI_PT_ChangeRequest_For_NPPlaces_Insert] 
    @Operation  NVARCHAR(10), 
    @Requestor NVARCHAR(50),
    @Feature NVARCHAR(max)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MyTableVar table(NewRequestId int);
    INSERT INTO [dbo].[POI_PT_ChangeRequest_For_NPPlaces]
      ([Operation],[Requestor],[FeatureJSON])
        OUTPUT INSERTED.RequestId INTO @MyTableVar
      VALUES (@Operation, @Requestor, @Feature);
    SELECT NewRequestId FROM @MyTableVar;
END
GO


-- View to combine Change Requests and ChangeRequest Actions to determine status of Change Request
-- Grant SELECT to Public

USE [akr_socio]
GO

/****** Object:  View [dbo].[POI_PT_ChangeRequestStatus_For_NPPlaces]    Script Date: 12/30/2014 3:57:45 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE VIEW [dbo].[POI_PT_ChangeRequestStatus_For_NPPlaces] AS 
select CR.RequestId, A.[TimeStamp], [Action], Comment from POI_PT_ChangeRequest_For_NPPlaces as CR
left join POI_PT_ChangeRequestAction_For_NPPlaces as A
on CR.RequestId = A.RequestId


GO



