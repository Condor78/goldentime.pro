import json, collections
F="/root/.claude/projects/-home-user-goldentime-pro/891b79e0-2a6d-503f-bca6-a6fcbf6556d7/tool-results/mcp-n8n-get_workflow_execution-1789303911531.txt"
d=json.load(open(F))
rd=d["data"]["resultData"]["runData"]
companies=[it["json"] for it in rd["Estrai"][0]["data"]["main"][0]]
serper=[it["json"] for it in rd["Serper"][0]["data"]["main"][0]]
assert len(companies)==len(serper),(len(companies),len(serper))
N=len(companies)

def digits(s):
    return "".join(ch for ch in (s or "") if ch.isdigit())
def national(raw):
    dd=digits(raw)
    if dd.startswith("0039"): dd=dd[4:]
    if dd.startswith("39") and len(dd)>10: dd=dd[2:]
    return dd
def norm_match(raw):
    # for matching: national part (drops +39)
    return national(raw)
def classify_phone(raw):
    nat=national(raw)
    if not nat: return None
    if nat[0]=="3": return "cell"
    if nat[0]=="0": return "fisso"
    if nat[0]=="8": return "fisso"   # 800/803 numeri verdi -> Fisso (brief P7)
    return "fisso"
def split_phones(raws):
    cell=[]; fisso=[]; seen=set()
    for r in raws or []:
        r=(r or "").strip()
        if not r: continue
        k=norm_match(r)
        if not k or k in seen: continue
        seen.add(k)
        c=classify_phone(r)
        if c=="cell": cell.append(r)
        else: fisso.append(r)
    return " / ".join(cell), " / ".join(fisso)

# match v2 helpers
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
    return bool(lt) and lt[-1] in at
def cap_match(cap,addr):
    c=digits(cap)
    return len(c)>=4 and c in toks(addr)
def street_match(street,addr):
    pt=toks(street); at=set(toks(addr))
    nums=[t for t in pt if isnum(t)]
    words=[t for t in pt if len(t)>=4 and not isnum(t) and t not in STREET_STOP]
    return (any(n in at for n in nums) if nums else False) and any(w in at for w in words)
def name_overlap(name,title):
    a=[t for t in toks(name) if len(t)>=4 and t not in NAME_STOP]
    b=set(toks(title))
    if not a: return 0.0
    return sum(1 for t in a if t in b)/len(a)

def classify(c,resp):
    places=resp.get("places") if isinstance(resp,dict) else None
    places=places if isinstance(places,list) else []
    pgphones=set(x for x in (norm_match(p) for p in (c.get("telephones") or [])) if x and len(x)>=6)
    best=None; level="NESSUNO"; reason=""
    for p in places:
        if norm_match(p.get("phoneNumber")) in pgphones and pgphones:
            best,level,reason=p,"CERTO","telefono"; break
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
    website=(best.get("website","") if best else "") or ""
    if len(places)==0: stato="NON_SU_MAPS"
    elif level=="CERTO": stato="SITO_PRESENTE" if website else "SENZA_SITO_CONFERMATO"
    else: stato="DA_VERIFICARE"
    return best,level,reason,website,stato,len(places)

dist=collections.Counter(); rows=[]; nphones=collections.Counter()
for c,resp in zip(companies,serper):
    best,level,reason,website,stato,pc=classify(c,resp)
    cell,fisso=split_phones(c.get("telephones"))
    dist[stato]+=1
    nph=len([p for p in (c.get("telephones") or []) if p.strip()])
    nphones[nph]+=1
    rows.append({"regione":c.get("regione"),"comune_cercato":c.get("comune_cercato"),"categoria":c.get("categoria"),
        "pg_name":c.get("pg_name"),"pg_street":c.get("pg_street"),"pg_cap":c.get("pg_cap"),"pg_locality":c.get("pg_locality"),
        "telephones":c.get("telephones"),"cellulare":cell,"fisso":fisso,
        "match_level":level,"match_reason":reason,"stato":stato,"places_count":pc,
        "serper_title":(best.get("title") if best else ""),"serper_address":(best.get("address") if best else ""),
        "serper_phone":(best.get("phoneNumber") if best else ""),"serper_website":website,"pg_url":c.get("pg_url")})

print("N campione:",N)
print("Aziende per comune/cat:",dict(collections.Counter((r["comune_cercato"],r["categoria"]) for r in rows)))
print("\n== Distribuzione 4 stati ==")
for k in ["SENZA_SITO_CONFERMATO","SITO_PRESENTE","DA_VERIFICARE","NON_SU_MAPS"]:
    print("  %-24s %2d (%.0f%%)"%(k,dist[k],100*dist[k]/N))
print("\n== P7 telefoni ==")
print("  distribuzione n. telefoni/azienda:",dict(nphones))
cov_cell=sum(1 for r in rows if r["cellulare"]); cov_fisso=sum(1 for r in rows if r["fisso"]); cov_any=sum(1 for r in rows if r["cellulare"] or r["fisso"])
print("  righe con almeno un telefono: %d/%d (%.0f%%)"%(cov_any,N,100*cov_any/N))
print("  con cellulare: %d, con fisso: %d"%(cov_cell,cov_fisso))
addr_cov=sum(1 for r in rows if r["pg_street"]);
print("  indirizzo popolato: %d/%d (%.0f%%)"%(addr_cov,N,100*addr_cov/N))
print("\n== SENZA_SITO_CONFERMATO (verifica match) ==")
for r in rows:
    if r["stato"]=="SENZA_SITO_CONFERMATO":
        print("  [%s] %s | PG %s | GMB %s (%s) | cell:[%s] fisso:[%s]"%(r["match_reason"],r["pg_name"],(r["telephones"] or [None])[0],r["serper_phone"],r["serper_title"],r["cellulare"],r["fisso"]))

json.dump(rows, open("/tmp/claude-0/-home-user-goldentime-pro/891b79e0-2a6d-503f-bca6-a6fcbf6556d7/scratchpad/classificati_v3.json","w"), ensure_ascii=False, indent=1)
# raw sample for repo
sample=[]
for c,resp in zip(companies,serper):
    places=resp.get("places") if isinstance(resp,dict) else []
    places=places if isinstance(places,list) else []
    sample.append({"pg_name":c["pg_name"],"telephones":c.get("telephones"),"pg_street":c["pg_street"],"pg_cap":c["pg_cap"],"pg_locality":c["pg_locality"],"pg_url":c["pg_url"],"serperQuery":c.get("serperQuery"),
        "places":[{"title":p.get("title"),"address":p.get("address"),"phoneNumber":p.get("phoneNumber"),"website":p.get("website")} for p in places]})
json.dump(sample, open("/tmp/claude-0/-home-user-goldentime-pro/891b79e0-2a6d-503f-bca6-a6fcbf6556d7/scratchpad/pg_serper_v3.json","w"), ensure_ascii=False, indent=1)
print("\nsaved classificati_v3.json e pg_serper_v3.json")
