insert into customers(id,source_id,name,owner,segment,purpose,reviewed_on,retention_review_on) values
('10000000-0000-0000-0000-000000000001','demo-harbour','Harbour Software','Aroha','Enterprise','Monthly subscription review',current_date-10,current_date+180),
('10000000-0000-0000-0000-000000000002','demo-kauri','Kauri Systems','Mere','Growth','Monthly subscription review',current_date-45,current_date+180),
('10000000-0000-0000-0000-000000000003','demo-southern','Southern Apps','','Growth','Monthly subscription review',null,current_date-5),
('10000000-0000-0000-0000-000000000004','demo-tasman','Tasman Labs','Aroha','Enterprise','Monthly subscription review',current_date-10,current_date+180),
('10000000-0000-0000-0000-000000000005','demo-return','Returning Cloud','Mere','Growth','Monthly subscription review',current_date-10,current_date+180),
('10000000-0000-0000-0000-000000000006','demo-gap','Missing Month Ltd','Mere','Growth','Monthly subscription review',current_date-10,current_date+180)
on conflict(source_id) do nothing;
insert into monthly_mrr(customer_id,month,currency,mrr)
select c.id,(date_trunc('month',current_date)-make_interval(months=>v.months_back)+interval '1 month - 1 day')::date,'NZD',v.amount
from (values
 ('demo-harbour',3,1000),('demo-harbour',2,1000),('demo-harbour',1,1300),
 ('demo-kauri',3,800),('demo-kauri',2,800),('demo-kauri',1,500),
 ('demo-southern',3,400),('demo-southern',2,400),('demo-southern',1,0),
 ('demo-tasman',3,2000),('demo-tasman',2,2200),('demo-tasman',1,2400),
 ('demo-return',3,300),('demo-return',2,0),('demo-return',1,300),
 ('demo-gap',3,600),('demo-gap',1,700)) v(source,months_back,amount) join customers c on c.source_id=v.source
on conflict(customer_id,month) do nothing;
insert into actions(id,customer_id,title,owner,due_on) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','Explain the contraction','Mere',current_date-4),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000006','Recover the missing month','Aroha',current_date+3)
on conflict(id) do nothing;
