import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';
import {table as textTable} from './lib/format.mjs';

const tables=['customers','monthly_mrr','actions','notes','imports','month_reviews','audit_log'];
export const reads={
 customers:'select id,source_id,name,owner,segment,reviewed_on,retention_review_on from customers order by name',
 'monthly-review':'select * from v_monthly order by month desc,currency',
 movements:'select name,month,currency,prior_mrr,mrr,change,movement from v_movements where month=(select max(month) from monthly_mrr) order by change nulls last,name',
 'churn-review':"select name,owner,month,currency,prior_mrr,mrr,change,movement from v_movements where month=(select max(month) from monthly_mrr) and movement in ('churn','contraction') order by change",
 'expansion-review':"select name,owner,month,currency,prior_mrr,mrr,change,movement from v_movements where month=(select max(month) from monthly_mrr) and movement in ('expansion','activation','reactivation') order by change desc",
 concentration:`select c.name,m.currency,m.mrr,round(100*m.mrr/nullif(sum(m.mrr) over(partition by m.currency),0),2) as share_percent,c.owner from monthly_mrr m join customers c on c.id=m.customer_id where m.month=(select max(month) from monthly_mrr) and m.mrr>0 order by m.currency,m.mrr desc`,
 segments:`select segment,currency,count(*)::int customers,sum(mrr) mrr,sum(change) comparable_change from v_movements where month=(select max(month) from monthly_mrr) group by segment,currency order by currency,mrr desc`,
 retention:`select month,currency,count(*) filter(where prior_mrr>0 and change is not null)::int paired_opening_customers,
 sum(prior_mrr) filter(where prior_mrr>0 and change is not null) opening_mrr,
 round(100*sum(mrr) filter(where prior_mrr>0 and change is not null)/nullif(sum(prior_mrr) filter(where prior_mrr>0 and change is not null),0),2) net_retention_percent,
 round(100*sum(least(mrr,prior_mrr)) filter(where prior_mrr>0 and change is not null)/nullif(sum(prior_mrr) filter(where prior_mrr>0 and change is not null),0),2) gross_retention_percent
 from v_movements group by month,currency order by month desc,currency`,
 cohorts:`with first_seen as(select customer_id,currency,min(month) first_positive_month from monthly_mrr where mrr>0 group by customer_id,currency)
 select f.first_positive_month,m.month,m.currency,count(*)::int observed_customers,count(*) filter(where m.mrr>0)::int active_customers,sum(m.mrr) mrr from monthly_mrr m join first_seen f on f.customer_id=m.customer_id and f.currency=m.currency where m.month>=f.first_positive_month group by f.first_positive_month,m.month,m.currency order by f.first_positive_month,m.month`,
 'data-gaps':`select c.name,m.month,m.currency,'No adjacent prior observation' issue from monthly_mrr m join customers c on c.id=m.customer_id where exists(select 1 from monthly_mrr h where h.customer_id=m.customer_id and h.month<m.month) and not exists(select 1 from monthly_mrr p where p.customer_id=m.customer_id and p.month=(date_trunc('month',m.month)-interval '1 day')::date)
 union all select c.name,x.month,p.currency,'Prior customer absent this month' from (select distinct month from monthly_mrr) x join monthly_mrr p on p.month=(date_trunc('month',x.month)-interval '1 day')::date join customers c on c.id=p.customer_id where not exists(select 1 from monthly_mrr m where m.customer_id=p.customer_id and m.month=x.month)
 union all select name,month,currency,'Currency changed; excluded from retention' from v_movements where movement='currency_changed' order by month,name`,
 'owner-workload':`select owner,count(*)::int open_actions,count(*) filter(where due_on<current_date)::int overdue from actions where status='open' group by owner order by overdue desc,owner`,
 actions:`select a.id,c.name,a.title,a.owner,a.due_on,a.status,a.evidence from actions a join customers c on c.id=a.customer_id order by a.due_on,a.id`,
 attention:'select * from v_attention order by kind,name',
 history:'select entity,record_id,operation,actor,created_at from audit_log order by created_at,id',
 imports:'select file_name,sha256,currency,actor,customer_count,snapshot_count,created_at from imports order by created_at',
 compliance:`select 'ACC-01' rule,name,'Accuracy review missing or older than internal 30-day policy' issue from customers where reviewed_on is null or reviewed_on<current_date-30
 union all select 'RET-01',name,'Retention review date is missing or overdue' from customers where retention_review_on is null or retention_review_on<current_date
 union all select 'PUR-01',name,'Record why identifiable customer data is needed' from customers where trim(purpose)=''
 union all select 'OWN-01',name,'Assign the revenue review owner' from customers where trim(owner)='' order by rule,name`
};
export const commands=[...Object.keys(reads),'show','add','update','log','close-action','import','export','reconcile','signoffs','weekly-review','draft-revenue-pack','draft-customer-review','help'];
function options(args){const opts={},pos=[];for(const a of args){if(a.startsWith('--')){const i=a.indexOf('=');const k=a.slice(2,i<0?undefined:i);if(k in opts)throw Error(`Duplicate option ${k}`);opts[k]=i<0?true:a.slice(i+1);}else pos.push(a);}return {opts,pos};}
function need(o,k){if(typeof o[k]!=='string'||!o[k].trim())throw Error(`--${k}= is required`);return o[k].trim();}
function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(`Invalid ISO date: ${v}`);return v;}
function month(v){date(v);const d=new Date(v+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+1);if(d.getUTCDate()!==1)throw Error('Month must be a month-end date');if(v>=new Date().toISOString().slice(0,7)+'-01')throw Error('Only completed months can be imported or reconciled');return v;}
function money(v){if(!/^\d{1,14}(\.\d{1,2})?$/.test(String(v)))throw Error(`Amount must be non-negative with at most two decimals: ${v}`);return String(v);}
function cents(v){const [a,b='']=money(v).split('.');return BigInt(a)*100n+BigInt(b.padEnd(2,'0'));}
function currency(v){if(!/^[A-Z]{3}$/.test(v))throw Error('Currency must be three uppercase letters');return v;}
async function txn(db,fn,dry=false){await db.exec('BEGIN');try{const r=await fn();await db.exec(dry?'ROLLBACK':'COMMIT');return r;}catch(e){await db.exec('ROLLBACK');throw e;}}
async function audit(db,entity,id,operation,actor,before,after){await db.query('insert into audit_log(entity,record_id,operation,actor,before_record,after_record) values($1,$2,$3,$4,$5,$6)',[entity,id,operation,actor,before==null?null:JSON.stringify(before),after==null?null:JSON.stringify(after)]);}
async function resolve(db,table,query){if(!['customers','actions'].includes(table))throw Error('Entity must be customers or actions');if(!query)throw Error('A name or partial ID is required');const field=table==='customers'?'name':'title';const all=await db.query(`select * from ${table} order by ${field},id`);let hit=all.filter(r=>r.id===query||r[field].toLowerCase()===query.toLowerCase());if(!hit.length)hit=all.filter(r=>r.id.startsWith(query.toLowerCase())||r[field].toLowerCase().includes(query.toLowerCase()));if(hit.length!==1)throw Error(hit.length?`Ambiguous; choose an ID:\n${hit.map(r=>r.id+' '+r[field]).join('\n')}`:`No matching ${table}: ${query}`);return hit[0];}
async function fingerprint(db,m,c){const rows=await db.query('select customer_id,mrr::text from monthly_mrr where month=$1 and currency=$2 order by customer_id',[m,c]);return {rows,hash:createHash('sha256').update(JSON.stringify(rows)).digest('hex')};}
async function signoffs(db){const rows=await db.query('select * from month_reviews order by created_at desc,id');for(const r of rows){r.current=(await fingerprint(db,r.month,r.currency)).hash===r.fingerprint;}return rows;}
async function importFile(db,o){
 const file=need(o,'file'),actor=need(o,'actor'),cur=currency(need(o,'currency'));const text=readFileSync(file,'utf8');const records=parseCsv(text);
 if(!records.length)throw Error('Export contains no customer rows');const headers=Object.keys(records[0]);
 for(const h of ['customer_uuid','customer_name'])if(!headers.includes(h))throw Error(`Expected ChartMogul monthly customer export header: ${h}`);
 if(headers.some(h=>/^plan_|^mrr_|^quantity_/.test(h)))throw Error('Use MRR per Customer per Month, not the plan or quantity variants');
 const months=headers.filter(h=>/^\d{4}-\d{2}-\d{2}$/.test(h));if(!months.length)throw Error('No month-end columns found');months.forEach(month);
 const seen=new Set(),mapped=records.map(r=>{const source=r.customer_uuid.trim(),name=(r.company_name||r.customer_name).trim();if(!source||!name)throw Error('Customer UUID and name required');if(seen.has(source))throw Error('Duplicate customer UUID in export');seen.add(source);return {source,name,snapshots:months.filter(m=>r[m].trim()!=='').map(m=>({month:m,mrr:money(r[m].trim())}))};});
 const snapshots=mapped.reduce((n,r)=>n+r.snapshots.length,0);if(!snapshots)throw Error('No observed MRR values; blanks are unknown, not zero');
 return txn(db,async()=>{
 const batch=(await db.query('insert into imports(file_name,sha256,currency,actor,customer_count,snapshot_count) values($1,$2,$3,$4,$5,$6) returning *',[path.basename(file),createHash('sha256').update(text).digest('hex'),cur,actor,mapped.length,snapshots]))[0];let added=0,changed=0,unchanged=0;
 for(const r of mapped){let customer=(await db.query('select * from customers where source_id=$1',[r.source]))[0];if(!customer){customer=(await db.query('insert into customers(source_id,name) values($1,$2) returning *',[r.source,r.name]))[0];await audit(db,'customers',customer.id,'import',actor,null,customer);}else if(customer.name!==r.name){const after=(await db.query('update customers set name=$1,reviewed_on=null where id=$2 returning *',[r.name,customer.id]))[0];await audit(db,'customers',customer.id,'import rename',actor,customer,after);customer=after;}
 for(const s of r.snapshots){const before=(await db.query('select * from monthly_mrr where customer_id=$1 and month=$2',[customer.id,s.month]))[0];if(before&&before.currency===cur&&cents(before.mrr)===cents(s.mrr)){unchanged++;continue;}
 const after=(await db.query('insert into monthly_mrr(customer_id,month,currency,mrr,import_id) values($1,$2,$3,$4,$5) on conflict(customer_id,month) do update set currency=excluded.currency,mrr=excluded.mrr,import_id=excluded.import_id returning *',[customer.id,s.month,cur,s.mrr,batch.id]))[0];await audit(db,'monthly_mrr',after.id,before?'correct snapshot':'import',actor,before,after);before?changed++:added++;
 }}return {dry_run:!!o['dry-run'],customers:mapped.length,observations:snapshots,added,changed,unchanged,blank_cells:'Left unknown; existing observations retained'};
 },!!o['dry-run']);
}
function draft(name,data){const dir=path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');mkdirSync(dir,{recursive:true});const file=path.join(dir,`${name}-${randomUUID()}.md`);writeFileSync(file,`# ${name.replaceAll('-',' ')}\n\nDraft for review. Observations are monthly snapshots, not accounting revenue.\n\n${Object.entries(data).map(([k,v])=>`## ${k}\n\n${format(v)}`).join('\n\n')}\n`,{flag:'wx'});return {file};}
export function format(data){
 if(!Array.isArray(data))return JSON.stringify(data,null,2);
 if(!data.length)return 'No rows.';
 const cell=v=>v===null||v===undefined?'':String(typeof v==='object'?JSON.stringify(v):v).replace(/\r?\n/g,' ');
 return textTable(data,Object.keys(data[0]).map(key=>({key,label:key.replaceAll('_',' '),format:cell})));
}
export async function execute(db,args){
 const {opts:o,pos}=options(args),[cmd='help',entity,query]=pos;
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='help')return {commands,import:'import chartmogul --file=export.csv --currency=NZD --actor=Name [--dry-run]',add:'add customer --name=Name --source-id=ID --actor=Name; add action --customer=Name --title=Review --owner=Name --due=YYYY-MM-DD --actor=Name',update:'update customer NAME --owner=Name --segment=Segment --purpose=Purpose --reviewed-on=YYYY-MM-DD --retention-review-on=YYYY-MM-DD --actor=Name',reconcile:'reconcile --month=YYYY-MM-DD --currency=NZD --source-total=AMOUNT --evidence=Reference --actor=Name',scope:'Monthly snapshots only. Retention uses adjacent same-currency pairs. First observations are not new-business claims. Data gaps are unknown, never automatic churn.'};
 if(cmd==='signoffs')return signoffs(db);
 if(cmd==='show'){const r=await resolve(db,entity,query);return {...r,history:await db.query('select * from audit_log where record_id=$1 order by created_at',[r.id]),...(entity==='customers'?{observations:await db.query('select month,currency,mrr from monthly_mrr where customer_id=$1 order by month',[r.id]),notes:await db.query('select body,actor,created_at from notes where customer_id=$1 order by created_at',[r.id])}:{})};}
 if(cmd==='export'){const out={format:'subscription-analytics-v1',generated_at:new Date().toISOString()};for(const t of tables)out[t]=await db.query(`select * from ${t} order by id`);if(o.file){writeFileSync(need(o,'file'),JSON.stringify(out,null,2)+'\n',{flag:'wx'});return {file:o.file};}return out;}
 if(cmd==='import'){if(entity!=='chartmogul')throw Error('Supported import: chartmogul');return importFile(db,o);}
 if(['weekly-review','draft-revenue-pack','draft-customer-review'].includes(cmd)){
 if(cmd==='draft-customer-review'){const c=await resolve(db,'customers',entity);return draft(cmd,{customer:[{name:c.name,owner:c.owner,segment:c.segment}],movements:await db.query('select month,currency,prior_mrr,mrr,change,movement from v_movements where customer_id=$1 order by month',[c.id]),actions:await db.query('select title,owner,due_on,status from actions where customer_id=$1',[c.id])});}
 return draft(cmd,{monthly:await db.query(reads['monthly-review']),movements:await db.query(reads.movements),attention:await db.query(reads.attention),gaps:await db.query(reads['data-gaps']),signoffs:await signoffs(db)});
 }
 if(!['add','update','log','close-action','reconcile'].includes(cmd))throw Error(`Unknown command: ${cmd}`);
 const actor=need(o,'actor');return txn(db,async()=>{
 if(cmd==='reconcile'){const m=month(need(o,'month')),cur=currency(need(o,'currency')),total=money(need(o,'source-total')),evidence=need(o,'evidence');const f=await fingerprint(db,m,cur);if(!f.rows.length)throw Error('No observations for month and currency');if(f.rows.reduce((n,r)=>n+cents(r.mrr),0n)!==cents(total))throw Error('Source total does not match observed MRR');const r=(await db.query('insert into month_reviews(month,currency,source_total,evidence,actor,fingerprint) values($1,$2,$3,$4,$5,$6) returning *',[m,cur,total,evidence,actor,f.hash]))[0];await audit(db,'month_reviews',r.id,'reconcile',actor,null,r);return r;}
 if(cmd==='add'&&entity==='customer'){const r=(await db.query('insert into customers(source_id,name,owner,segment,purpose) values($1,$2,$3,$4,$5) returning *',[need(o,'source-id'),need(o,'name'),o.owner||'',o.segment||'Unassigned',o.purpose||'']))[0];await audit(db,'customers',r.id,'add',actor,null,r);return r;}
 if(cmd==='add'&&entity==='action'){const c=await resolve(db,'customers',need(o,'customer'));const r=(await db.query('insert into actions(customer_id,title,owner,due_on) values($1,$2,$3,$4) returning *',[c.id,need(o,'title'),need(o,'owner'),date(need(o,'due'))]))[0];await audit(db,'actions',r.id,'add',actor,null,r);return r;}
 if(cmd==='update'&&entity==='customer'){const before=await resolve(db,'customers',query);const fields={'name':'name','owner':'owner','segment':'segment','purpose':'purpose','reviewed-on':'reviewed_on','retention-review-on':'retention_review_on'};const edits=Object.keys(o).filter(k=>k!=='actor'&&k!=='json');if(!edits.length||edits.some(k=>!fields[k]))throw Error('Editable customer fields: '+Object.keys(fields).join(', '));const values=edits.map(k=>k.endsWith('-on')?date(need(o,k)):need(o,k));if(o['reviewed-on']&&o['reviewed-on']>new Date().toISOString().slice(0,10))throw Error('Accuracy review cannot be in the future');values.push(before.id);const r=(await db.query(`update customers set ${edits.map((k,i)=>`${fields[k]}=$${i+1}`).join(',')} where id=$${values.length} returning *`,values))[0];await audit(db,'customers',r.id,'update',actor,before,r);return r;}
 if(cmd==='log'){const c=await resolve(db,'customers',entity);const r=(await db.query('insert into notes(customer_id,body,actor) values($1,$2,$3) returning *',[c.id,need(o,'body'),actor]))[0];await audit(db,'notes',r.id,'log',actor,null,r);return r;}
 if(cmd==='close-action'){const before=await resolve(db,'actions',entity);if(before.status==='closed')throw Error('Already closed');const r=(await db.query("update actions set status='closed',evidence=$1,closed_by=$2,closed_at=now() where id=$3 returning *",[need(o,'evidence'),actor,before.id]))[0];await audit(db,'actions',r.id,'close',actor,before,r);return r;}
 throw Error('Use add customer, add action or update customer; see help');
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const result=await execute(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):format(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
