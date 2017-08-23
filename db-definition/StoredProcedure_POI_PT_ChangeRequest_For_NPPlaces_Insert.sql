USE [akr_socio]
GO

/****** Object:  StoredProcedure [dbo].[POI_PT_ChangeRequest_For_NPPlaces_Insert]    Script Date: 8/25/2015 11:28:44 AM ******/
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


