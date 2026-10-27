import type {Query} from '../registration/service';
export async function claimAIRequest(query:Query,id:number){
 if(!Number.isSafeInteger(id)||id<=0)return false;
 const {rows}=await query(`INSERT INTO vaynexo_ai_limits(telegram_id,next_request_at,usage_day,requests) VALUES($1,now()+interval '5 seconds',CURRENT_DATE,1)
 ON CONFLICT(telegram_id) DO UPDATE SET next_request_at=EXCLUDED.next_request_at,usage_day=CURRENT_DATE,requests=CASE WHEN vaynexo_ai_limits.usage_day=CURRENT_DATE THEN vaynexo_ai_limits.requests+1 ELSE 1 END
 WHERE vaynexo_ai_limits.next_request_at<=now() AND (vaynexo_ai_limits.usage_day<CURRENT_DATE OR vaynexo_ai_limits.requests<100) RETURNING telegram_id`,[id]);return rows.length>0;
}
