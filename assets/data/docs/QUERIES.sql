DROP TABLE IF EXISTS idx;CREATE TABLE idx AS 

WITH RECURSIVE
	targets(nid) AS (
		SELECT nid FROM ( SELECT DISTINCT nid FROM iref WHERE iref MATCH 'type:exposicion place:sevilla'
		INTERSECT
		SELECT nid FROM ref WHERE year BETWEEN 2000 AND 2020)
		UNION
		SELECT nid FROM (SELECT DISTINCT nid FROM iref WHERE iref MATCH 'type:institucion "reina sofia"')
		UNION
		SELECT nid FROM (SELECT DISTINCT nid FROM iref WHERE iref MATCH 'type:actor femenino NOT españa'
		INTERSECT
		SELECT nid FROM ref WHERE ageyears BETWEEN 20 AND 30)
	),
	relations(nid, relation, rid) AS (SELECT nid, relation, rid FROM rel WHERE nid IN targets AND rid IN targets),
	rnid(nid, relation, rid) AS (SELECT nid, relation, rid FROM rel WHERE nid IN targets AND NOT EXISTS (SELECT nid FROM relations)),
	rrid(nid, relation, rid) AS (SELECT nid, relation, rid FROM rel WHERE rid IN targets AND NOT EXISTS (SELECT nid FROM relations) AND NOT EXISTS(SELECT nid FROM rnid)),
	matches(nid, relation, rid) AS (SELECT DISTINCT nid, relation, rid FROM relations UNION SELECT DISTINCT nid, relation, rid FROM rnid UNION SELECT DISTINCT nid, relation, rid FROM rrid),
	singles(nid) AS (SELECT DISTINCT nid FROM (SELECT nid FROM matches UNION SELECT rid FROM matches))
	
SELECT * FROM singles


