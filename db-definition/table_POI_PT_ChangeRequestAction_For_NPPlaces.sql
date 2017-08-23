USE [akr_socio]
GO

/****** Object:  Table [dbo].[POI_PT_ChangeRequestAction_For_NPPlaces]    Script Date: 8/25/2015 11:57:42 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[POI_PT_ChangeRequestAction_For_NPPlaces](
	[ActionId] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[TimeStamp] [datetime2](7) NOT NULL,
	[RequestId] [int] NOT NULL,
	[Action] [nvarchar](10) NOT NULL,
	[Reviewer] [nvarchar](50) NOT NULL,
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


