UPDATE rooms SET topic='up_'||substr(topic,6) WHERE topic LIKE 'trip_%';
UPDATE push_jobs SET retry_at=0 WHERE sent=0;
