
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
	[Operation] [nvarchar](10) NOT NULL,  -- {'Insert', 'Delete', 'Update', 'Cancel'}
	[Requestor] [nvarchar](50) NOT NULL,  -- ?? OSM Login, AD Login, SSID, Friendly Name ??
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
	[Action] [nvarchar](10) NOT NULL, -- Approve, Deny, Partial Approve, Canceled
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



