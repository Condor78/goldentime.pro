import json, sys, collections

F="/root/.claude/projects/-home-user-goldentime-pro/891b79e0-2a6d-503f-bca6-a6fcbf6556d7/tool-results/mcp-n8n-get_workflow_execution-1789114428713.txt"
d=json.load(open(F))
rd=d["data"]["resultData"]["runData"]
companies=[it["json"] for it in rd["Estrai e Campiona"][0]["data"]["main"][0]]
serper=[it["json"] for it in rd["Serper Places"][0]["data"]["main"][0]]
assert len(companies)==len(serper), (len(companies),len(serper))
N=len(companies)

def digits(s):
    s=s or ""; return "".join(ch for ch in s if ch.isdigit())
def norm_phone(s):
    dd=digits(s)
    if len(dd)>10 and dd[:2]=="39": dd=dd[2:]
    return dd
def toks(s):
    s=(s or "").lower(); out=[]; cur=""
    for ch in s:
        if ch.isalnum(): cur+=ch
        else:
            if cur: out.append(cur); cur=""
    if cur: out.append(cur)
    return out
def isnum(t): return t.isdigit()
STREET_STOP=set("via viale corso piazza piazzale vicolo strada stradale largo contrada localita loc borgo salita calle".split())
NAME_STOP=set("impianti impianto elettrici elettrico elettrica idraulica idraulico idraulici termoidraulica termoidraulico parrucchiere parrucchieri parrucchiera snc srl srls sas spa and del della delle dei service group casa clima hair salon salone".split())

def locality_match(loc,addr):
    lt=toks(loc); at=toks(addr)
    if not lt: return False
    return lt[-1] in at
def cap_match(cap,addr):
    c=digits(cap)
    if len(c)<4: return False
    return c in toks(addr)
def street_match(street,addr):
    pt=toks(street); at=set(toks(addr))
    nums=[t for t in pt if isnum(t)]
    words=[t for t in pt if len(t)>=4 and not isnum(t) and t not in STREET_STOP]
    num_ok = any(n in at for n in nums) if nums else False
    word_ok = any(w in at for w in words)
    return num_ok and word_ok
def name_overlap(name,title):
    a=[t for t in toks(name) if len(t)>=4 and t not in NAME_STOP]
    b=set(toks(title))
    if not a: return 0.0
    hit=sum(1 for t in a if t in b)
    return hit/len(a)

def classify(c, resp, version):
    places = resp.get("places") if isinstance(resp,dict) else None
    places = places if isinstance(places,list) else []
    pgph=norm_phone(c.get("pg_phone"))
    best=None; level="NESSUNO"; reason=""
    # 1 phone
    for p in places:
        if pgph and norm_phone(p.get("phoneNumber")) == pgph and len(pgph)>=6:
            best,level,reason=p,"CERTO","telefono"; break
    if version=="v1":
        if not best:
            for p in places:
                a=p.get("address","") or ""
                if street_match(c.get("pg_street",""),a) and locality_match(c.get("pg_locality",""),a):
                    best,level,reason=p,"CERTO","via+comune"; break
        if not best:
            for p in places:
                if name_overlap(c.get("pg_name",""),p.get("title","") or "")>=0.5 and locality_match(c.get("pg_locality",""),p.get("address","") or ""):
                    best,level,reason=p,"PROBABILE","nome+comune"; break
    else: # v2
        if not best:
            for p in places:
                a=p.get("address","") or ""
                if street_match(c.get("pg_street",""),a) and (locality_match(c.get("pg_locality",""),a) or cap_match(c.get("pg_cap",""),a)):
                    best,level,reason=p,"CERTO","via+cap/comune"; break
        if not best:
            for p in places:
                if street_match(c.get("pg_street",""),p.get("address","") or "") and name_overlap(c.get("pg_name",""),p.get("title","") or "")>=0.5:
                    best,level,reason=p,"CERTO","via+nome"; break
        if not best:
            for p in places:
                a=p.get("address","") or ""
                if name_overlap(c.get("pg_name",""),p.get("title","") or "")>=0.5 and (locality_match(c.get("pg_locality",""),a) or cap_match(c.get("pg_cap",""),a)):
                    best,level,reason=p,"PROBABILE","nome+cap/comune"; break
    website = (best.get("website","") if best else "") or ""
    if len(places)==0: stato="NON_SU_MAPS"
    elif level=="CERTO": stato="SITO_PRESENTE" if website else "SENZA_SITO_CONFERMATO"
    else: stato="DA_VERIFICARE"
    return best,level,reason,website,stato,len(places)

for version in ["v1","v2"]:
    dist=collections.Counter()
    rows=[]
    for c,resp in zip(companies,serper):
        best,level,reason,website,stato,pc=classify(c,resp,version)
        dist[stato]+=1
        rows.append((c,best,level,reason,website,stato,pc))
    print("==== %s ==== (N=%d)"%(version,N))
    for k in ["SENZA_SITO_CONFERMATO","SITO_PRESENTE","DA_VERIFICARE","NON_SU_MAPS"]:
        print("  %-24s %2d (%.0f%%)"%(k,dist[k],100*dist[k]/N))
    if version=="v2":
        print("  --- SENZA_SITO_CONFERMATO dettaglio (verifica match) ---")
        for c,best,level,reason,website,stato,pc in rows:
            if stato=="SENZA_SITO_CONFERMATO":
                print("   [%s] %s | PG %s %s | GMB %s | %s"%(reason, c["pg_name"], c["pg_phone"], c["pg_locality"], (best.get("phoneNumber") if best else ""), (best.get("title") if best else "")))
        # save classified rows fixture
        out=[]
        for c,best,level,reason,website,stato,pc in rows:
            out.append({**{k:c.get(k) for k in ["regione","comune_cercato","categoria","pg_name","pg_street","pg_cap","pg_locality","pg_phone"]},
                        "telefono_norm":norm_phone(c.get("pg_phone")),
                        "match_level":level,"match_reason":reason,"stato":stato,"places_count":pc,
                        "serper_title":(best.get("title") if best else ""),
                        "serper_address":(best.get("address") if best else ""),
                        "serper_phone":(best.get("phoneNumber") if best else ""),
                        "serper_website":website})
        json.dump(out, open("/home/user/goldentime.pro/docs/leadgen/fixtures/classificati_v2.json","w"), ensure_ascii=False, indent=1)
        # save raw serper sample (trimmed)
        sample=[]
        for c,resp in zip(companies,serper):
            places=resp.get("places") if isinstance(resp,dict) else []
            places=places if isinstance(places,list) else []
            sample.append({"pg_name":c["pg_name"],"pg_phone":c["pg_phone"],"pg_street":c["pg_street"],"pg_cap":c["pg_cap"],"pg_locality":c["pg_locality"],
                           "serperQuery":c.get("serperQuery"),
                           "places":[{"title":p.get("title"),"address":p.get("address"),"phoneNumber":p.get("phoneNumber"),"website":p.get("website")} for p in places]})
        json.dump(sample, open("/home/user/goldentime.pro/docs/leadgen/fixtures/serper_sample.json","w"), ensure_ascii=False, indent=1)
