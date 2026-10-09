UPDATE rooms SET topic='up'||lower(hex(randomblob(6))) WHERE length(topic)<>14 OR substr(topic,1,2)<>'up';
UPDATE push_jobs SET retry_at=0 WHERE sent=0;
