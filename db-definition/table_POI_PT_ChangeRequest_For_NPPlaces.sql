USE [akr_socio]
GO

/****** Object:  Table [dbo].[POI_PT_ChangeRequest_For_NPPlaces]    Script Date: 8/25/2015 11:57:21 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[POI_PT_ChangeRequest_For_NPPlaces](
	[RequestId] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
	[TimeStamp] [datetime2](7) NOT NULL,
	[Operation] [nvarchar](10) NOT NULL,
	[Requestor] [nvarchar](255) NOT NULL,
	[FeatureJSON] [nvarchar](max) NOT NULL,
 CONSTRAINT [PK_POI_PT_ChangeRequest_For_NPPlaces] PRIMARY KEY CLUSTERED 
(
	[RequestId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO

ALTER TABLE [dbo].[POI_PT_ChangeRequest_For_NPPlaces] ADD  CONSTRAINT [DF_POI_PT_ChangeRequest_For_NPPlaces_TimeStamp]  DEFAULT (getutcdate()) FOR [TimeStamp]
GO


