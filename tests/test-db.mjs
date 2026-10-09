import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export function makeEnv(tokens={}) {
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../server/schema.sql',import.meta.url),'utf8'));
 for(const [role,token] of Object.entries(tokens))db.prepare('INSERT INTO access(hash,role) VALUES(?,?)').run(createHash('sha256').update(token).digest('hex'),role);
 const env={DB:{prepare(sql){const query={args:[],bind(...args){this.args=args;return this;},async first(){return db.prepare(sql).get(...this.args)||null;},async all(){return {results:db.prepare(sql).all(...this.args)};},async run(){const result=db.prepare(sql).run(...this.args);return {meta:{changes:Number(result.changes)}};}};return query;},async batch(queries){db.exec('BEGIN');try{const results=[];for(const q of queries)results.push(await q.run());db.exec('COMMIT');return results;}catch(e){db.exec('ROLLBACK');throw e;}}}};
 return {env,db};
}
