IF OBJECT_ID('tempdb..#t_bigint') IS NOT NULL DROP TABLE #t_bigint; CREATE TABLE #t_bigint(f bigint)
INSERT INTO #t_bigint(f) VALUES()
IF OBJECT_ID('tempdb..#t_bit') IS NOT NULL DROP TABLE #t_bit; CREATE TABLE #t_bit(f bit)
INSERT INTO #t_bit(f) VALUES()
IF OBJECT_ID('tempdb..#t_decimal') IS NOT NULL DROP TABLE #t_decimal; CREATE TABLE #t_decimal(f decimal)
INSERT INTO #t_decimal(f) VALUES()
IF OBJECT_ID('tempdb..#t_int') IS NOT NULL DROP TABLE #t_int; CREATE TABLE #t_int(f int)
INSERT INTO #t_int(f) VALUES()
IF OBJECT_ID('tempdb..#t_money') IS NOT NULL DROP TABLE #t_money; CREATE TABLE #t_money(f money)
INSERT INTO #t_money(f) VALUES()
IF OBJECT_ID('tempdb..#t_numeric') IS NOT NULL DROP TABLE #t_numeric; CREATE TABLE #t_numeric(f numeric)
INSERT INTO #t_numeric(f) VALUES()
IF OBJECT_ID('tempdb..#t_smallint') IS NOT NULL DROP TABLE #t_smallint; CREATE TABLE #t_smallint(f smallint)
INSERT INTO #t_smallint(f) VALUES()
IF OBJECT_ID('tempdb..#t_smallmoney') IS NOT NULL DROP TABLE #t_smallmoney; CREATE TABLE #t_smallmoney(f smallmoney)
INSERT INTO #t_smallmoney(f) VALUES()
IF OBJECT_ID('tempdb..#t_tinyint') IS NOT NULL DROP TABLE #t_tinyint; CREATE TABLE #t_tinyint(f tinyint)
INSERT INTO #t_tinyint(f) VALUES()
IF OBJECT_ID('tempdb..#t_float') IS NOT NULL DROP TABLE #t_float; CREATE TABLE #t_float(f float)
INSERT INTO #t_float(f) VALUES()
IF OBJECT_ID('tempdb..#t_real') IS NOT NULL DROP TABLE #t_real; CREATE TABLE #t_real(f real)
INSERT INTO #t_real(f) VALUES()
IF OBJECT_ID('tempdb..#t_date') IS NOT NULL DROP TABLE #t_date; CREATE TABLE #t_date(f date)
INSERT INTO #t_date(f) VALUES()
IF OBJECT_ID('tempdb..#t_datetime2') IS NOT NULL DROP TABLE #t_datetime2; CREATE TABLE #t_datetime2(f datetime2)
INSERT INTO #t_datetime2(f) VALUES()
IF OBJECT_ID('tempdb..#t_datetime') IS NOT NULL DROP TABLE #t_datetime; CREATE TABLE #t_datetime(f datetime)
INSERT INTO #t_datetime(f) VALUES()
IF OBJECT_ID('tempdb..#t_datetimeoffset') IS NOT NULL DROP TABLE #t_datetimeoffset; CREATE TABLE #t_datetimeoffset(f datetimeoffset)
INSERT INTO #t_datetimeoffset(f) VALUES()
IF OBJECT_ID('tempdb..#t_smalldatetime') IS NOT NULL DROP TABLE #t_smalldatetime; CREATE TABLE #t_smalldatetime(f smalldatetime)
INSERT INTO #t_smalldatetime(f) VALUES()
IF OBJECT_ID('tempdb..#t_time') IS NOT NULL DROP TABLE #t_time; CREATE TABLE #t_time(f time)
INSERT INTO #t_time(f) VALUES()
IF OBJECT_ID('tempdb..#t_char') IS NOT NULL DROP TABLE #t_char; CREATE TABLE #t_char(f char)
INSERT INTO #t_char(f) VALUES()
IF OBJECT_ID('tempdb..#t_text') IS NOT NULL DROP TABLE #t_text; CREATE TABLE #t_text(f text)
INSERT INTO #t_text(f) VALUES()
IF OBJECT_ID('tempdb..#t_varchar') IS NOT NULL DROP TABLE #t_varchar; CREATE TABLE #t_varchar(f varchar)
INSERT INTO #t_varchar(f) VALUES()
IF OBJECT_ID('tempdb..#t_sysname') IS NOT NULL DROP TABLE #t_sysname; CREATE TABLE #t_sysname(f sysname)
INSERT INTO #t_sysname(f) VALUES()
IF OBJECT_ID('tempdb..#t_nchar') IS NOT NULL DROP TABLE #t_nchar; CREATE TABLE #t_nchar(f nchar)
INSERT INTO #t_nchar(f) VALUES()
IF OBJECT_ID('tempdb..#t_ntext') IS NOT NULL DROP TABLE #t_ntext; CREATE TABLE #t_ntext(f ntext)
INSERT INTO #t_ntext(f) VALUES()
IF OBJECT_ID('tempdb..#t_nvarchar') IS NOT NULL DROP TABLE #t_nvarchar; CREATE TABLE #t_nvarchar(f nvarchar)
INSERT INTO #t_nvarchar(f) VALUES()
IF OBJECT_ID('tempdb..#t_binary') IS NOT NULL DROP TABLE #t_binary; CREATE TABLE #t_binary(f binary)
INSERT INTO #t_binary(f) VALUES()
IF OBJECT_ID('tempdb..#t_image') IS NOT NULL DROP TABLE #t_image; CREATE TABLE #t_image(f image)
INSERT INTO #t_image(f) VALUES()
IF OBJECT_ID('tempdb..#t_varbinary') IS NOT NULL DROP TABLE #t_varbinary; CREATE TABLE #t_varbinary(f varbinary)
INSERT INTO #t_varbinary(f) VALUES()
IF OBJECT_ID('tempdb..#t_hierarchyid') IS NOT NULL DROP TABLE #t_hierarchyid; CREATE TABLE #t_hierarchyid(f hierarchyid)
INSERT INTO #t_hierarchyid(f) VALUES()
IF OBJECT_ID('tempdb..#t_sql_variant') IS NOT NULL DROP TABLE #t_sql_variant; CREATE TABLE #t_sql_variant(f sql_variant)
INSERT INTO #t_sql_variant(f) VALUES()
IF OBJECT_ID('tempdb..#t_xml') IS NOT NULL DROP TABLE #t_xml; CREATE TABLE #t_xml(f xml)
INSERT INTO #t_xml(f) VALUES()
IF OBJECT_ID('tempdb..#t_uniqueidentifier') IS NOT NULL DROP TABLE #t_uniqueidentifier; CREATE TABLE #t_uniqueidentifier(f uniqueidentifier)
INSERT INTO #t_uniqueidentifier(f) VALUES()
IF OBJECT_ID('tempdb..#t_timestamp') IS NOT NULL DROP TABLE #t_timestamp; CREATE TABLE #t_timestamp(f timestamp)
INSERT INTO #t_timestamp(f) VALUES()
IF OBJECT_ID('tempdb..#t_geometry') IS NOT NULL DROP TABLE #t_geometry; CREATE TABLE #t_geometry(f geometry)
INSERT INTO #t_geometry(f) VALUES()
IF OBJECT_ID('tempdb..#t_geography') IS NOT NULL DROP TABLE #t_geography; CREATE TABLE #t_geography(f geography)
INSERT INTO #t_geography(f) VALUES()


/*
IF OBJECT_ID('tempdb..#t1') IS NOT NULL DROP TABLE #t1 
CREATE TABLE #t1(
	fld_bigint BIGINT NULL,
    fld_bit BIT NULL,
    fld_decimal DECIMAL NULL,
    fld_int INT NULL,
    fld_money MONEY NULL,
    fld_numeric NUMERIC NULL,
    fld_smallint SMALLINT NULL,
    fld_smallmoney SMALLMONEY NULL,
    fld_tinyint TINYINT NULL
    fld_float FLOAT NULL,
    fld_real REAL NULL,
    fld_date DATE NULL,
    fld_datetime2 DATETIME2 NULL,
    fld_datetime DATETIME NULL,
    fld_datetimeoffset DATETIMEOFFSET NULL,
    fld_smalldatetime SMALLDATETIME NULL,
    fld_time TIME NULL,
    fld_char CHAR NULL,
    fld_text TEXT NULL,
    fld_varchar VARCHAR NULL,
    fld_sysname SYSNAME NULL,
    fld_nchar NCHAR NULL,
    fld_ntext NTEXT NULL,
    fld_nvarchar NVARCHAR NULL,
    fld_binary BINARY NULL,
    fld_image IMAGE NULL,
    fld_varbinary VARBINARY NULL,
    fld_hierarchyid HIERARCHYID NULL,
    fld_sql_variant SQL_VARIANT NULL,
    fld_xml XML NULL,
    fld_uniqueidentifier UNIQUEIDENTIFIER NULL,
    fld_timestamp TIMESTAMP NOT NULL,
    fld_geometry GEOMETRY NULL,
    fld_geography GEOGRAPHY NULL
)
*/