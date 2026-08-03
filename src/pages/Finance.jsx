// src/pages/Finance.jsx
import { useState, useEffect, useCallback } from "react";
import { finance as financeApi, members as membersApi } from "../lib/api.js";
import { PageHeader, Btn, Ico, Spinner, ErrorMsg, Empty, Modal, Field, Stat } from "../components/ui/index.jsx";

const CONTRIBUTION_TYPES   = ["TITHE","OFFERING","BUILDING_FUND","MISSIONS","BENEVOLENCE","YOUTH_FUND","OTHER"];
const CONTRIBUTION_METHODS = ["CASH","CHECK","ONLINE","ACH","CARD","OTHER"];
const TYPE_LABELS   = { TITHE:"Tithe", OFFERING:"Offering", BUILDING_FUND:"Building Fund", MISSIONS:"Missions", BENEVOLENCE:"Benevolence", YOUTH_FUND:"Youth Fund", OTHER:"Other" };
const METHOD_LABELS = { CASH:"Cash", CHECK:"Check", ONLINE:"Online", ACH:"ACH", CARD:"Card", OTHER:"Other" };
const BUDGET_ICONS  = ["💰","👥","🏛️","🌍","🧒","🎵","📋","❤️","🎉","📖","🙏","🛠️","🎓","🤝","🚐","🌱"];

export default function Finance({ t }) {
  const [activeTab, setActiveTab] = useState("giving");
  const tabs = [
    { id: "giving", label: "Giving Log" },
    { id: "budget", label: "Budget" },
    { id: "donors", label: "Donor Statements" },
  ];

  return (
    <div>
      <PageHeader t={t} title="Finances" subtitle="Contributions, budgets, and donor management" />
      <div style={{ padding: "0 32px", background: t.white, borderBottom: `1px solid ${t.border}`, display: "flex", gap: 4 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "13px 22px", border: "none", background: "transparent", cursor: "pointer",
            fontFamily: "inherit", fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
            color: activeTab === tab.id ? t.primary : t.textMuted,
            borderBottom: activeTab === tab.id ? `2px solid ${t.primary}` : "2px solid transparent",
            transition: "all 0.15s",
          }}>{tab.label}</button>
        ))}
      </div>
      <div style={{ padding: "24px 32px" }}>
        {activeTab === "giving"  && <GivingLog  t={t} />}
        {activeTab === "budget"  && <BudgetView t={t} />}
        {activeTab === "donors"  && <DonorView  t={t} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GIVING LOG
// ═══════════════════════════════════════════════════════════════
function GivingLog({ t }) {
  const [data,        setData]        = useState({ contributions: [], pagination: {}, totals: {} });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [search,      setSearch]      = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter,   setTypeFilter]   = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [yearFilter,   setYearFilter]   = useState("2026");
  const [page,        setPage]        = useState(1);
  const [showSingle,  setShowSingle]  = useState(false);
  const [showBatch,   setShowBatch]   = useState(false);
  const [showImport,  setShowImport]  = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [deleteTarget,setDeleteTarget]= useState(null);
  const [deleting,    setDeleting]    = useState(false);

  const load = useCallback(() => {
    setLoading(true); setError("");
    financeApi.listContributions({ page, limit: 25, search, type: typeFilter, method: methodFilter, year: yearFilter })
      .then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [page, search, typeFilter, methodFilter, yearFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = async () => {
    setDeleting(true);
    try { await financeApi.deleteContribution(deleteTarget.id); setDeleteTarget(null); load(); }
    catch (e) { setError(e.message); } finally { setDeleting(false); }
  };

  const { contributions, pagination, totals } = data;

  return (
    <div>
      <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
        <Stat t={t} label="Filtered Total" value={`$${(totals.sum||0).toLocaleString()}`} color={t.success} sub={`${totals.count||0} contributions`} />
        <Stat t={t} label="Year" value={yearFilter} sub="Viewing contributions for" />
      </div>
      {error && <ErrorMsg t={t} message={error} />}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: t.textMuted }}><Ico name="search" size={15} /></div>
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search by member name..."
            style={{ width: "100%", padding: "9px 12px 9px 36px", borderRadius: 9, border: `1px solid ${t.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", background: t.white, boxSizing: "border-box" }} />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          style={{ padding: "9px 12px", borderRadius: 9, border: `1px solid ${t.border}`, fontSize: 12, fontFamily: "inherit", background: t.white, cursor: "pointer" }}>
          <option value="">All Types</option>
          {CONTRIBUTION_TYPES.map(tp => <option key={tp} value={tp}>{TYPE_LABELS[tp]}</option>)}
        </select>
        <select value={methodFilter} onChange={e => { setMethodFilter(e.target.value); setPage(1); }}
          style={{ padding: "9px 12px", borderRadius: 9, border: `1px solid ${t.border}`, fontSize: 12, fontFamily: "inherit", background: t.white, cursor: "pointer" }}>
          <option value="">All Methods</option>
          {CONTRIBUTION_METHODS.map(m => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
        </select>
        <select value={yearFilter} onChange={e => { setYearFilter(e.target.value); setPage(1); }}
          style={{ padding: "9px 12px", borderRadius: 9, border: `1px solid ${t.border}`, fontSize: 12, fontFamily: "inherit", background: t.white, cursor: "pointer" }}>
          {["2026","2025","2024","2023"].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <Btn t={t} variant="secondary" onClick={() => setShowImport(true)}><Ico name="upload" size={14} /> Import CSV</Btn>
          <Btn t={t} variant="secondary" onClick={() => setShowBatch(true)}><Ico name="plus" size={14} /> Batch Entry</Btn>
          <Btn t={t} onClick={() => { setEditTarget(null); setShowSingle(true); }}><Ico name="plus" size={14} /> Add Contribution</Btn>
        </div>
      </div>

      {loading ? <Spinner t={t} /> : (
        <>
          <div style={{ background: t.white, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: t.surface }}>
                  {["Date","Member","Type","Method","Amount","Actions"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "11px 13px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: t.primary, letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contributions.length === 0
                  ? <tr><td colSpan={6}><Empty t={t} message="No contributions found." /></td></tr>
                  : contributions.map(c => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${t.border}`, transition: "background 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = t.surface}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "10px 13px" }}>{new Date(c.date).toLocaleDateString()}</td>
                      <td style={{ padding: "10px 13px", fontWeight: 500 }}>
                        {c.member ? `${c.member.firstName} ${c.member.lastName}` : <span style={{ color: t.textMuted }}>Anonymous</span>}
                      </td>
                      <td style={{ padding: "10px 13px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: c.type === "TITHE" ? "#E8F5EE" : t.surface, color: c.type === "TITHE" ? t.success : t.primary }}>
                          {TYPE_LABELS[c.type] || c.type}
                        </span>
                      </td>
                      <td style={{ padding: "10px 13px", color: t.textMuted }}>{METHOD_LABELS[c.method] || c.method}</td>
                      <td style={{ padding: "10px 13px", fontWeight: 700, color: t.success }}>${Number(c.amount).toLocaleString()}</td>
                      <td style={{ padding: "10px 13px" }}>
                        <div style={{ display: "flex", gap: 5 }}>
                          <Btn small t={t} variant="ghost" onClick={() => { setEditTarget(c); setShowSingle(true); }}><Ico name="edit" size={12} /></Btn>
                          <Btn small t={t} variant="danger" onClick={() => setDeleteTarget(c)}><Ico name="trash" size={12} /></Btn>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, fontSize: 12 }}>
              <span style={{ color: t.textMuted }}>Showing {((pagination.page-1)*25)+1}–{Math.min(pagination.page*25, pagination.total)} of {pagination.total}</span>
              <div style={{ display: "flex", gap: 4 }}>
                <Btn small t={t} variant="ghost" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>Prev</Btn>
                {Array.from({length: Math.min(5,pagination.totalPages)},(_,i)=>{const p=page<=3?i+1:page+i-2;if(p>pagination.totalPages||p<1)return null;return<Btn key={p} small t={t} variant={p===page?"primary":"ghost"} onClick={()=>setPage(p)}>{p}</Btn>;})}
                <Btn small t={t} variant="ghost" onClick={() => setPage(p => Math.min(pagination.totalPages,p+1))} disabled={page===pagination.totalPages}>Next</Btn>
              </div>
            </div>
          )}
        </>
      )}

      {showSingle && <ContributionForm t={t} contribution={editTarget} onClose={() => { setShowSingle(false); setEditTarget(null); }} onSaved={() => { setShowSingle(false); setEditTarget(null); load(); }} />}
      {showBatch  && <BatchContributionForm t={t} onClose={() => setShowBatch(false)} onSaved={() => { setShowBatch(false); load(); }} />}
      {showImport && <ImportContributionsForm t={t} onClose={() => setShowImport(false)} onSaved={() => { setShowImport(false); load(); }} />}
      {deleteTarget && (
        <Modal t={t} title="Delete Contribution" onClose={() => setDeleteTarget(null)} width={400}>
          <p style={{ fontSize: 14, marginBottom: 20 }}>
            Delete this <strong>{TYPE_LABELS[deleteTarget.type]}</strong> of <strong>${Number(deleteTarget.amount).toLocaleString()}</strong>? This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn t={t} variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Btn>
            <Btn t={t} variant="red" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Single Contribution Form ─────────────────────────────────
function ContributionForm({ t, contribution, onClose, onSaved }) {
  const isEdit = !!contribution;
  const [memberList,   setMemberList]   = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [form, setForm] = useState({
    memberId: contribution?.memberId || "",
    amount:   contribution ? String(contribution.amount) : "",
    type:     contribution?.type   || "TITHE",
    method:   contribution?.method || "CASH",
    date:     contribution?.date   ? new Date(contribution.date).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
    notes:    contribution?.notes  || "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const inputStyle = { width: "100%", padding: "9px 13px", borderRadius: 9, border: `1px solid ${t.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

  useEffect(() => {
    if (memberSearch.length < 2) { setMemberList([]); return; }
    membersApi.list({ search: memberSearch, limit: 10, isMinor: "false" })
      .then(d => setMemberList(d.members || [])).catch(() => {});
  }, [memberSearch]);

  const handleSubmit = async () => {
    if (!form.amount || isNaN(parseFloat(form.amount))) { setError("Enter a valid amount."); return; }
    setSaving(true); setError("");
    try {
      isEdit ? await financeApi.updateContribution(contribution.id, form) : await financeApi.createContribution(form);
      onSaved();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const selectedMember = memberList.find(m => m.id === form.memberId);

  return (
    <Modal t={t} title={isEdit ? "Edit Contribution" : "Record Contribution"} onClose={onClose}>
      {error && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA", color: t.danger, fontSize: 13 }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Member (leave blank for anonymous)">
            {form.memberId ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 9, border: `1px solid ${t.primary}`, background: t.surface }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : "Selected member"}</span>
                <button onClick={() => { set("memberId",""); setMemberSearch(""); }} style={{ background:"none", border:"none", cursor:"pointer", color:t.textMuted }}><Ico name="x" size={14}/></button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Type a name to search..." style={inputStyle} />
                {memberList.length > 0 && (
                  <div style={{ position:"absolute", top:"100%", left:0, right:0, background:t.white, border:`1px solid ${t.border}`, borderRadius:9, boxShadow:"0 4px 12px rgba(0,0,0,0.1)", zIndex:10, maxHeight:200, overflow:"auto" }}>
                    {memberList.map(m => (
                      <button key={m.id} onClick={() => { set("memberId",m.id); setMemberSearch(""); setMemberList([]); }}
                        style={{ display:"block", width:"100%", padding:"9px 14px", textAlign:"left", background:"none", border:"none", cursor:"pointer", fontSize:13, fontFamily:"inherit", borderBottom:`1px solid ${t.border}` }}
                        onMouseEnter={e=>e.currentTarget.style.background=t.surface}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        {m.firstName} {m.lastName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Field>
        </div>
        <Field label="Amount ($)" required>
          <input value={form.amount} onChange={e => set("amount",e.target.value)} placeholder="0.00" type="number" min="0" step="0.01" style={inputStyle} />
        </Field>
        <Field label="Date">
          <input value={form.date} onChange={e => set("date",e.target.value)} type="date" style={inputStyle} />
        </Field>
        <Field label="Type">
          <select value={form.type} onChange={e => set("type",e.target.value)} style={{...inputStyle,cursor:"pointer"}}>
            {CONTRIBUTION_TYPES.map(tp => <option key={tp} value={tp}>{TYPE_LABELS[tp]}</option>)}
          </select>
        </Field>
        <Field label="Method">
          <select value={form.method} onChange={e => set("method",e.target.value)} style={{...inputStyle,cursor:"pointer"}}>
            {CONTRIBUTION_METHODS.map(m => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
          </select>
        </Field>
        <div style={{ gridColumn:"1/-1" }}>
          <Field label="Notes">
            <textarea value={form.notes} onChange={e => set("notes",e.target.value)} rows={2} style={{...inputStyle,resize:"vertical"}} placeholder="Optional note..." />
          </Field>
        </div>
      </div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
        <Btn t={t} variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn t={t} onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : isEdit ? "Save Changes" : "Record Contribution"}</Btn>
      </div>
    </Modal>
  );
}

// ─── Batch Contribution Form ──────────────────────────────────
function BatchContributionForm({ t, onClose, onSaved }) {
  const [serviceDate,    setServiceDate]    = useState(new Date().toISOString().slice(0,10));
  const [defaultMethod,  setDefaultMethod]  = useState("CHECK");
  const [rows,           setRows]           = useState(Array.from({length:8},()=>({memberId:"",memberSearch:"",memberName:"",amount:"",type:"TITHE",method:""})));
  const [memberResults,  setMemberResults]  = useState({});
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState("");
  const [result,         setResult]         = useState(null);
  const inputStyle = { width:"100%", padding:"7px 10px", borderRadius:8, border:`1px solid ${t.border}`, fontSize:12, fontFamily:"inherit", outline:"none", boxSizing:"border-box" };

  const updateRow  = (i,k,v) => setRows(prev => prev.map((r,idx) => idx===i?{...r,[k]:v}:r));
  const searchMember = async (i, query) => {
    updateRow(i,"memberSearch",query);
    if (query.length < 2) { setMemberResults(p=>({...p,[i]:[]})); return; }
    try { const d = await membersApi.list({search:query,limit:6,isMinor:"false"}); setMemberResults(p=>({...p,[i]:d.members||[]})); } catch {}
  };
  const selectMember = (i,m) => { updateRow(i,"memberId",m.id); updateRow(i,"memberName",`${m.firstName} ${m.lastName}`); updateRow(i,"memberSearch",""); setMemberResults(p=>({...p,[i]:[]})); };
  const clearMember  = (i)   => { updateRow(i,"memberId",""); updateRow(i,"memberName",""); updateRow(i,"memberSearch",""); };
  const addRows      = ()    => setRows(p=>[...p,...Array.from({length:5},()=>({memberId:"",memberSearch:"",memberName:"",amount:"",type:"TITHE",method:""}))]);

  const filledRows = rows.filter(r=>r.amount&&parseFloat(r.amount)>0);
  const batchTotal = filledRows.reduce((s,r)=>s+parseFloat(r.amount||0),0);

  const handleSubmit = async () => {
    if (filledRows.length===0) { setError("Enter at least one contribution amount."); return; }
    setSaving(true); setError("");
    try {
      const res = await financeApi.createBatch({ contributions: filledRows.map(r=>({memberId:r.memberId||null,amount:r.amount,type:r.type||"TITHE",method:r.method||null})), serviceDate, defaultMethod });
      setResult(res);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  if (result) return (
    <Modal t={t} title="Batch Entry Complete" onClose={onSaved} width={400}>
      <div style={{textAlign:"center",padding:"8px 0 20px"}}>
        <div style={{fontSize:40,marginBottom:12}}>✅</div>
        <div style={{fontSize:24,fontWeight:700,color:t.success}}>${result.total.toLocaleString()}</div>
        <div style={{color:t.textMuted,fontSize:14,marginTop:4}}>{result.created} contributions recorded</div>
        {result.errors>0&&<div style={{color:t.warning,fontSize:13,marginTop:8}}>{result.errors} entries had errors and were skipped.</div>}
      </div>
      <div style={{display:"flex",justifyContent:"center"}}><Btn t={t} onClick={onSaved}>Done</Btn></div>
    </Modal>
  );

  return (
    <Modal t={t} title="Batch Contribution Entry" onClose={onClose} width={720}>
      {error && <div style={{marginBottom:14,padding:"10px 14px",borderRadius:9,background:"#FEF2F2",border:"1px solid #FECACA",color:t.danger,fontSize:13}}>{error}</div>}
      <div style={{display:"flex",gap:12,marginBottom:20,padding:"14px 16px",borderRadius:10,background:t.surface}}>
        <div style={{flex:1}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:t.textMuted,marginBottom:4}}>Service Date</div>
          <input value={serviceDate} onChange={e=>setServiceDate(e.target.value)} type="date" style={{...inputStyle,background:t.white}} />
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:t.textMuted,marginBottom:4}}>Default Method</div>
          <select value={defaultMethod} onChange={e=>setDefaultMethod(e.target.value)} style={{...inputStyle,background:t.white,cursor:"pointer"}}>
            {CONTRIBUTION_METHODS.map(m=><option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
          </select>
        </div>
        <div style={{alignSelf:"flex-end",padding:"7px 14px",borderRadius:9,background:t.primary,color:"#fff",fontSize:13,fontWeight:600}}>
          {filledRows.length} entries · ${batchTotal.toLocaleString()}
        </div>
      </div>
      <div style={{maxHeight:360,overflow:"auto",border:`1px solid ${t.border}`,borderRadius:10}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr style={{background:t.surface}}>
              {["#","Member (optional)","Amount","Type","Method"].map(h=>(
                <th key={h} style={{textAlign:"left",padding:"9px 10px",fontWeight:700,fontSize:10,textTransform:"uppercase",color:t.primary,letterSpacing:"0.05em"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row,i)=>(
              <tr key={i} style={{borderBottom:`1px solid ${t.border}`,background:row.amount?`rgba(${t.rgb},0.02)`:"transparent"}}>
                <td style={{padding:"6px 10px",color:t.textMuted,fontWeight:600,width:30}}>{i+1}</td>
                <td style={{padding:"6px 10px",minWidth:180}}>
                  {row.memberId?(
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{fontSize:11,fontWeight:500}}>{row.memberName}</span>
                      <button onClick={()=>clearMember(i)} style={{background:"none",border:"none",cursor:"pointer",color:t.textMuted,padding:0}}><Ico name="x" size={12}/></button>
                    </div>
                  ):(
                    <div style={{position:"relative"}}>
                      <input value={row.memberSearch} onChange={e=>searchMember(i,e.target.value)} placeholder="Search member..." style={inputStyle} />
                      {(memberResults[i]||[]).length>0&&(
                        <div style={{position:"absolute",top:"100%",left:0,right:0,background:t.white,border:`1px solid ${t.border}`,borderRadius:8,boxShadow:"0 4px 12px rgba(0,0,0,0.1)",zIndex:100}}>
                          {memberResults[i].map(m=>(
                            <button key={m.id} onClick={()=>selectMember(i,m)} style={{display:"block",width:"100%",padding:"7px 10px",textAlign:"left",background:"none",border:"none",cursor:"pointer",fontSize:12,fontFamily:"inherit",borderBottom:`1px solid ${t.border}`}}>
                              {m.firstName} {m.lastName}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td style={{padding:"6px 8px",width:100}}>
                  <input value={row.amount} onChange={e=>updateRow(i,"amount",e.target.value)} placeholder="0.00" type="number" min="0" step="0.01" style={{...inputStyle,textAlign:"right"}} />
                </td>
                <td style={{padding:"6px 8px",width:130}}>
                  <select value={row.type} onChange={e=>updateRow(i,"type",e.target.value)} style={{...inputStyle,cursor:"pointer"}}>
                    {CONTRIBUTION_TYPES.map(tp=><option key={tp} value={tp}>{TYPE_LABELS[tp]}</option>)}
                  </select>
                </td>
                <td style={{padding:"6px 8px",width:110}}>
                  <select value={row.method} onChange={e=>updateRow(i,"method",e.target.value)} style={{...inputStyle,cursor:"pointer"}}>
                    <option value="">Default</option>
                    {CONTRIBUTION_METHODS.map(m=><option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addRows} style={{marginTop:8,background:"none",border:"none",cursor:"pointer",color:t.primary,fontSize:12,fontWeight:600,fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>
        <Ico name="plus" size={14}/> Add 5 more rows
      </button>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
        <Btn t={t} variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn t={t} onClick={handleSubmit} disabled={saving||filledRows.length===0}>
          {saving?"Saving...":`Submit ${filledRows.length} Contribution${filledRows.length!==1?"s":""}`}
        </Btn>
      </div>
    </Modal>
  );
}

// ─── CSV Import Form ───────────────────────────────────────────
const IMPORT_FIELDS = [
  { key: "",          label: "— Ignore —" },
  { key: "date",       label: "Date" },
  { key: "firstName",  label: "First Name" },
  { key: "lastName",   label: "Last Name" },
  { key: "fullName",   label: "Full Name" },
  { key: "email",      label: "Email" },
  { key: "amount",     label: "Amount" },
  { key: "type",       label: "Type" },
  { key: "method",     label: "Method" },
  { key: "notes",      label: "Notes" },
];
const HEADER_GUESSES = {
  date:      ["date","contributiondate","giftdate","transactiondate"],
  firstName: ["firstname","first"],
  lastName:  ["lastname","last"],
  fullName:  ["name","fullname","donor","donorname","member","membername"],
  email:     ["email","emailaddress"],
  amount:    ["amount","total","giftamount","contribution","contributionamount"],
  type:      ["type","fund","category"],
  method:    ["method","paymentmethod","paymenttype"],
  notes:     ["notes","note","memo","comment"],
};

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i+1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ""; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => !(r.length === 1 && r[0].trim() === ""));
}

function normalizeHeader(h) { return h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""); }
function guessField(header) {
  const norm = normalizeHeader(header);
  for (const [field, candidates] of Object.entries(HEADER_GUESSES)) {
    if (candidates.includes(norm)) return field;
  }
  return "";
}
function normalizeEnum(val, validList) {
  if (!val) return "";
  const norm = val.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return validList.includes(norm) ? norm : "";
}
function downloadCsvTemplate() {
  const csv = "Date,First Name,Last Name,Email,Amount,Type,Method,Notes\n2026-01-05,John,Smith,john@example.com,100.00,TITHE,CHECK,\n";
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "giving-import-template.csv"; a.click();
  URL.revokeObjectURL(url);
}

function ImportContributionsForm({ t, onClose, onSaved }) {
  const [step,          setStep]          = useState("upload"); // upload | map | result
  const [fileName,      setFileName]      = useState("");
  const [headers,       setHeaders]       = useState([]);
  const [dataRows,      setDataRows]      = useState([]);
  const [mapping,       setMapping]       = useState({});
  const [defaultType,   setDefaultType]   = useState("TITHE");
  const [defaultMethod, setDefaultMethod] = useState("CHECK");
  const [importing,     setImporting]     = useState(false);
  const [error,         setError]         = useState("");
  const [result,        setResult]        = useState(null);
  const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 9, border: `1px solid ${t.border}`, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCSV(String(reader.result));
      if (rows.length < 2) { setError("That CSV doesn't have any data rows."); return; }
      const [hdrRow, ...rest] = rows;
      const guessedMapping = {};
      hdrRow.forEach(h => { guessedMapping[h] = guessField(h); });
      setFileName(file.name);
      setHeaders(hdrRow);
      setDataRows(rest.filter(r => r.some(v => v.trim() !== "")).map(r => Object.fromEntries(hdrRow.map((h,i) => [h, (r[i] ?? "").trim()]))));
      setMapping(guessedMapping);
      setStep("map");
    };
    reader.readAsText(file);
  };

  const buildRows = () => dataRows.map(r => {
    const out = { firstName: "", lastName: "", email: "", amount: "", type: "", method: "", date: "", notes: "" };
    for (const [header, field] of Object.entries(mapping)) {
      if (!field) continue;
      const val = r[header] ?? "";
      if (field === "fullName") {
        const parts = val.trim().split(/\s+/).filter(Boolean);
        if (!out.firstName) out.firstName = parts[0] || "";
        if (!out.lastName)  out.lastName  = parts.slice(1).join(" ");
      } else if (field === "amount") {
        out.amount = val.replace(/[^0-9.\-]/g, "");
      } else if (field === "type") {
        out.type = normalizeEnum(val, CONTRIBUTION_TYPES);
      } else if (field === "method") {
        out.method = normalizeEnum(val, CONTRIBUTION_METHODS);
      } else {
        out[field] = val;
      }
    }
    return out;
  });

  const mappedRows = step === "map" ? buildRows() : [];
  const amountMapped = Object.values(mapping).includes("amount");

  const handleImport = async () => {
    if (!amountMapped) { setError("Map a column to Amount before importing."); return; }
    setImporting(true); setError("");
    try {
      const res = await financeApi.importContributions({ rows: mappedRows, defaultType, defaultMethod });
      setResult(res);
      setStep("result");
    } catch (e) { setError(e.message); } finally { setImporting(false); }
  };

  if (step === "result" && result) return (
    <Modal t={t} title="Import Complete" onClose={onSaved} width={460}>
      <div style={{ textAlign: "center", padding: "8px 0 20px" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: t.success }}>${result.total.toLocaleString()}</div>
        <div style={{ color: t.textMuted, fontSize: 14, marginTop: 4 }}>{result.created} contributions imported</div>
        {result.errors > 0 && <div style={{ color: t.danger, fontSize: 13, marginTop: 8 }}>{result.errors} row{result.errors!==1?"s":""} skipped due to errors.</div>}
        {result.unmatched > 0 && <div style={{ color: t.warning, fontSize: 13, marginTop: 8 }}>{result.unmatched} row{result.unmatched!==1?"s":""} recorded as anonymous — no matching member found.</div>}
      </div>
      {result.unmatchedRows?.length > 0 && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 9, background: t.surface, fontSize: 12, maxHeight: 140, overflow: "auto" }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: t.textMuted, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.06em" }}>Unmatched Rows</div>
          {result.unmatchedRows.map(u => <div key={u.index} style={{ padding: "3px 0" }}>Row {u.index+2}: {u.name || "(no name)"}</div>)}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "center" }}><Btn t={t} onClick={onSaved}>Done</Btn></div>
    </Modal>
  );

  if (step === "upload") return (
    <Modal t={t} title="Import Giving CSV" onClose={onClose} width={480}>
      {error && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA", color: t.danger, fontSize: 13 }}>{error}</div>}
      <div style={{ border: `2px dashed ${t.border}`, borderRadius: 12, padding: "32px 20px", textAlign: "center", background: t.surface }}>
        <div style={{ color: t.primary, marginBottom: 10 }}><Ico name="upload" size={28} /></div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Select a CSV file to import</div>
        <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>You'll map columns to fields and preview before saving.</div>
        <label style={{ display: "inline-block" }}>
          <input type="file" accept=".csv,text/csv" onChange={handleFile} style={{ display: "none" }} />
          <span style={{ padding: "9px 18px", borderRadius: 9, background: t.primary, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Choose File</span>
        </label>
      </div>
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <button onClick={downloadCsvTemplate} style={{ background: "none", border: "none", cursor: "pointer", color: t.primary, fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
          Download a sample CSV template
        </button>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <Btn t={t} variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );

  // step === "map"
  const previewRows = mappedRows.slice(0, 6);
  return (
    <Modal t={t} title={`Map Columns — ${fileName}`} onClose={onClose} width={760}>
      {error && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA", color: t.danger, fontSize: 13 }}>{error}</div>}
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 12 }}>{dataRows.length} row{dataRows.length!==1?"s":""} detected. Map each CSV column to a field — unmatched member names will be recorded as anonymous.</div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: t.textMuted, marginBottom: 4 }}>Default Type</div>
          <select value={defaultType} onChange={e => setDefaultType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            {CONTRIBUTION_TYPES.map(tp => <option key={tp} value={tp}>{TYPE_LABELS[tp]}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: t.textMuted, marginBottom: 4 }}>Default Method</div>
          <select value={defaultMethod} onChange={e => setDefaultMethod(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            {CONTRIBUTION_METHODS.map(m => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
          </select>
        </div>
      </div>

      <div style={{ maxHeight: 130, overflow: "auto", border: `1px solid ${t.border}`, borderRadius: 10, marginBottom: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: t.surface }}>
              {headers.map(h => <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: t.primary, letterSpacing: "0.05em" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              {headers.map(h => (
                <td key={h} style={{ padding: "6px 8px" }}>
                  <select value={mapping[h] || ""} onChange={e => setMapping(p => ({ ...p, [h]: e.target.value }))} style={{ ...inputStyle, padding: "6px 8px", cursor: "pointer" }}>
                    {IMPORT_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {!amountMapped && <div style={{ marginBottom: 12, fontSize: 12, color: t.warning }}>Map a column to "Amount" to continue.</div>}

      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: t.textMuted, marginBottom: 6 }}>Preview</div>
      <div style={{ maxHeight: 220, overflow: "auto", border: `1px solid ${t.border}`, borderRadius: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: t.surface }}>
              {["Date","Name","Email","Amount","Type","Method","Notes"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: t.primary, letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((r,i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${t.border}` }}>
                <td style={{ padding: "7px 10px" }}>{r.date || "—"}</td>
                <td style={{ padding: "7px 10px" }}>{[r.firstName,r.lastName].filter(Boolean).join(" ") || <span style={{ color: t.textMuted }}>Anonymous</span>}</td>
                <td style={{ padding: "7px 10px", color: t.textMuted }}>{r.email || "—"}</td>
                <td style={{ padding: "7px 10px", fontWeight: 600, color: !r.amount || isNaN(parseFloat(r.amount)) ? t.danger : t.success }}>{r.amount ? `$${r.amount}` : "invalid"}</td>
                <td style={{ padding: "7px 10px" }}>{TYPE_LABELS[r.type] || `${TYPE_LABELS[defaultType]} (default)`}</td>
                <td style={{ padding: "7px 10px" }}>{METHOD_LABELS[r.method] || `${METHOD_LABELS[defaultMethod]} (default)`}</td>
                <td style={{ padding: "7px 10px", color: t.textMuted }}>{r.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {mappedRows.length > previewRows.length && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>+ {mappedRows.length - previewRows.length} more row{mappedRows.length-previewRows.length!==1?"s":""} not shown</div>}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <Btn t={t} variant="ghost" onClick={() => setStep("upload")}>Back</Btn>
        <Btn t={t} onClick={handleImport} disabled={importing || !amountMapped}>
          {importing ? "Importing..." : `Import ${mappedRows.length} Contribution${mappedRows.length!==1?"s":""}`}
        </Btn>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// BUDGET VIEW
// ═══════════════════════════════════════════════════════════════
function BudgetView({ t }) {
  const [data,        setData]        = useState({ budgets:[], totalBudgeted:0, totalSpent:0 });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [year,        setYear]        = useState("2026");
  const [showForm,    setShowForm]    = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [deleteTarget,setDeleteTarget]= useState(null);
  const [deleting,    setDeleting]    = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    financeApi.getBudgets({ year }).then(setData).catch(e=>setError(e.message)).finally(()=>setLoading(false));
  }, [year]);
  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    try { await financeApi.deleteBudget(deleteTarget.id); setDeleteTarget(null); load(); }
    catch (e) { setError(e.message); } finally { setDeleting(false); }
  };

  const { budgets, totalBudgeted, totalSpent } = data;
  const overallPct = totalBudgeted > 0 ? Math.round((totalSpent/totalBudgeted)*100) : 0;

  return (
    <div>
      <div style={{ display:"flex", gap:14, marginBottom:22 }}>
        <Stat t={t} label="Total Budgeted" value={`$${totalBudgeted.toLocaleString()}`} />
        <Stat t={t} label="Total Spent" value={`$${totalSpent.toLocaleString()}`} color={overallPct>80?t.danger:t.warning} sub={`${overallPct}% of annual budget`} />
        <Stat t={t} label="Remaining" value={`$${(totalBudgeted-totalSpent).toLocaleString()}`} color={t.success} />
      </div>
      {error && <ErrorMsg t={t} message={error} />}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <select value={year} onChange={e=>setYear(e.target.value)}
          style={{ padding:"9px 12px", borderRadius:9, border:`1px solid ${t.border}`, fontSize:12, fontFamily:"inherit", background:t.white, cursor:"pointer" }}>
          {["2026","2025","2024","2023"].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <Btn t={t} onClick={() => { setEditTarget(null); setShowForm(true); }}><Ico name="plus" size={14}/> Add Category</Btn>
      </div>
      {loading ? <Spinner t={t}/> : budgets.length===0 ? <Empty t={t} message="No budget categories yet." /> : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {budgets.map(b=>{
            const pct   = b.budgetedAmount>0?Math.round((Number(b.spentAmount)/Number(b.budgetedAmount))*100):0;
            const qPct  = Math.round((Number(b.spentAmount)/(Number(b.budgetedAmount)/4))*100);
            return (
              <div key={b.id} style={{ background:t.white, borderRadius:12, padding:"18px 20px", border:`1px solid ${t.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:22 }}>{b.icon}</span>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14 }}>{b.category}</div>
                      {b.notes&&<div style={{ fontSize:11, color:t.textMuted, marginTop:1 }}>{b.notes}</div>}
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ textAlign:"right", fontSize:12 }}>
                      <span style={{ fontWeight:700 }}>${Number(b.spentAmount).toLocaleString()}</span>
                      <span style={{ color:t.textMuted }}> / ${Number(b.budgetedAmount).toLocaleString()}</span>
                    </div>
                    <div style={{ display:"flex", gap:4 }}>
                      <Btn small t={t} variant="ghost" onClick={()=>{ setEditTarget(b); setShowForm(true); }}><Ico name="edit" size={12}/></Btn>
                      <Btn small t={t} variant="danger" onClick={()=>setDeleteTarget(b)}><Ico name="trash" size={12}/></Btn>
                    </div>
                  </div>
                </div>
                <div style={{ height:8, background:t.surface, borderRadius:4, overflow:"hidden" }}>
                  <div style={{ width:`${Math.min(pct,100)}%`, height:"100%", borderRadius:4, background:qPct>100?t.danger:qPct>80?t.warning:`linear-gradient(90deg,${t.primary},${t.accent})`, transition:"width 0.5s" }}/>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:11, color:t.textMuted }}>
                  <span>{pct}% of annual budget</span>
                  <span style={{ color:qPct>100?t.danger:t.textMuted, fontWeight:qPct>100?600:400 }}>Q1 pace: {qPct}% {qPct>100?"⚠ Over":"· On track"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showForm && <BudgetForm t={t} budget={editTarget} year={year} onClose={()=>{ setShowForm(false); setEditTarget(null); }} onSaved={()=>{ setShowForm(false); setEditTarget(null); load(); }} />}
      {deleteTarget && (
        <Modal t={t} title="Delete Budget Category" onClose={()=>setDeleteTarget(null)} width={400}>
          <p style={{ fontSize:14, marginBottom:20 }}>Delete <strong>{deleteTarget.icon} {deleteTarget.category}</strong>? This cannot be undone.</p>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <Btn t={t} variant="ghost" onClick={()=>setDeleteTarget(null)}>Cancel</Btn>
            <Btn t={t} variant="red" onClick={handleDelete} disabled={deleting}>{deleting?"Deleting...":"Delete"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function BudgetForm({ t, budget, year, onClose, onSaved }) {
  const isEdit = !!budget;
  const [form, setForm] = useState({ category:budget?.category||"", icon:budget?.icon||"💰", budgetedAmount:budget?String(budget.budgetedAmount):"", spentAmount:budget?String(budget.spentAmount):"0", notes:budget?.notes||"", year:budget?.year||year||"2026" });
  const [saving,setSaving]=useState(false);const[error,setError]=useState("");
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const inputStyle={width:"100%",padding:"9px 13px",borderRadius:9,border:`1px solid ${t.border}`,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};
  const handleSubmit=async()=>{
    if(!form.category.trim()){setError("Category name is required.");return;}
    if(!form.budgetedAmount||isNaN(parseFloat(form.budgetedAmount))){setError("Enter a valid budgeted amount.");return;}
    setSaving(true);setError("");
    try{isEdit?await financeApi.updateBudget(budget.id,form):await financeApi.createBudget(form);onSaved();}
    catch(e){setError(e.message);}finally{setSaving(false);}
  };
  return (
    <Modal t={t} title={isEdit?"Edit Budget Category":"Add Budget Category"} onClose={onClose}>
      {error&&<div style={{marginBottom:14,padding:"10px 14px",borderRadius:9,background:"#FEF2F2",border:"1px solid #FECACA",color:t.danger,fontSize:13}}>{error}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={{gridColumn:"1/-1"}}><Field label="Category Name" required><input value={form.category} onChange={e=>set("category",e.target.value)} placeholder="e.g. Staff Salaries" style={{...inputStyle,width:"100%"}}/></Field></div>
        <div style={{gridColumn:"1/-1"}}>
          <Field label="Icon">
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {BUDGET_ICONS.map(ic=>(<button key={ic} onClick={()=>set("icon",ic)} style={{width:36,height:36,borderRadius:7,border:form.icon===ic?`2px solid ${t.primary}`:`1px solid ${t.border}`,background:form.icon===ic?t.surface:t.white,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>{ic}</button>))}
            </div>
          </Field>
        </div>
        <Field label="Budgeted Amount ($)" required><input value={form.budgetedAmount} onChange={e=>set("budgetedAmount",e.target.value)} type="number" min="0" step="100" placeholder="0.00" style={inputStyle}/></Field>
        <Field label="Spent So Far ($)"><input value={form.spentAmount} onChange={e=>set("spentAmount",e.target.value)} type="number" min="0" step="0.01" placeholder="0.00" style={inputStyle}/></Field>
        <div style={{gridColumn:"1/-1"}}><Field label="Notes"><textarea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={2} style={{...inputStyle,resize:"vertical"}} placeholder="Optional description..."/></Field></div>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
        <Btn t={t} variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn t={t} onClick={handleSubmit} disabled={saving}>{saving?"Saving...":isEdit?"Save Changes":"Add Category"}</Btn>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// DONOR VIEW
// ═══════════════════════════════════════════════════════════════
function DonorView({ t }) {
  const [data,        setData]        = useState({ donors:[], totalGiving:0 });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [year,        setYear]        = useState("2026");
  const [search,      setSearch]      = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [expanded,    setExpanded]    = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    financeApi.getDonors({ year, search }).then(setData).catch(e=>setError(e.message)).finally(()=>setLoading(false));
  }, [year, search]);
  useEffect(()=>{ load(); },[load]);
  useEffect(()=>{ const timer=setTimeout(()=>setSearch(searchInput),400); return()=>clearTimeout(timer); },[searchInput]);

  const { donors, totalGiving } = data;

  return (
    <div>
      <div style={{display:"flex",gap:14,marginBottom:22}}>
        <Stat t={t} label="Total Donors" value={donors.length}/>
        <Stat t={t} label={`${year} Total Giving`} value={`$${totalGiving.toLocaleString()}`} color={t.success}/>
        <Stat t={t} label="Avg. Gift" value={donors.length>0?`$${Math.round(totalGiving/Math.max(1,donors.reduce((s,d)=>s+d.count,0))).toLocaleString()}`:"—"}/>
      </div>
      {error&&<ErrorMsg t={t} message={error}/>}
      <div style={{display:"flex",gap:10,marginBottom:16}}>
        <div style={{position:"relative",flex:1}}>
          <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:t.textMuted}}><Ico name="search" size={15}/></div>
          <input value={searchInput} onChange={e=>setSearchInput(e.target.value)} placeholder="Search by name..."
            style={{width:"100%",padding:"9px 12px 9px 36px",borderRadius:9,border:`1px solid ${t.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:t.white,boxSizing:"border-box"}}/>
        </div>
        <select value={year} onChange={e=>setYear(e.target.value)}
          style={{padding:"9px 12px",borderRadius:9,border:`1px solid ${t.border}`,fontSize:12,fontFamily:"inherit",background:t.white,cursor:"pointer"}}>
          {["2026","2025","2024","2023"].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <Btn t={t} variant="secondary"><Ico name="download" size={14}/> Export All</Btn>
      </div>
      {loading?<Spinner t={t}/>:donors.length===0?<Empty t={t} message="No donors found for this period."/>:(
        <div style={{background:t.white,borderRadius:12,border:`1px solid ${t.border}`,overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:t.surface}}>
                {["Donor","Gifts","YTD Total","Avg. Gift","Receipt",""].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"11px 13px",fontWeight:700,fontSize:10,textTransform:"uppercase",color:t.primary,letterSpacing:"0.06em"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {donors.map(d=>(
                <>
                  <tr key={d.memberId||"anon"} style={{borderBottom:`1px solid ${t.border}`,cursor:"pointer"}}
                    onMouseEnter={e=>e.currentTarget.style.background=t.surface}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                    onClick={()=>setExpanded(expanded===d.memberId?null:d.memberId)}>
                    <td style={{padding:"10px 13px",fontWeight:600}}>{d.memberName}</td>
                    <td style={{padding:"10px 13px"}}>{d.count}</td>
                    <td style={{padding:"10px 13px",fontWeight:700,color:t.success}}>${d.total.toLocaleString()}</td>
                    <td style={{padding:"10px 13px"}}>${Math.round(d.total/d.count).toLocaleString()}</td>
                    <td style={{padding:"10px 13px"}}>{d.memberId&&<Btn small t={t} variant="secondary"><Ico name="download" size={12}/> Tax Receipt</Btn>}</td>
                    <td style={{padding:"10px 13px",color:t.textMuted}}><Ico name={expanded===d.memberId?"chevDown":"chevron"} size={14}/></td>
                  </tr>
                  {expanded===d.memberId&&(
                    <tr key={`${d.memberId}-exp`}>
                      <td colSpan={6} style={{padding:"0 13px 12px",background:t.surface}}>
                        <div style={{display:"flex",flexWrap:"wrap",gap:8,paddingTop:10}}>
                          {d.contributions.map(c=>(
                            <div key={c.id} style={{padding:"6px 12px",borderRadius:8,background:t.white,border:`1px solid ${t.border}`,fontSize:11}}>
                              <span style={{fontWeight:600}}>${c.amount.toLocaleString()}</span>
                              <span style={{color:t.textMuted,marginLeft:6}}>{TYPE_LABELS[c.type]} · {METHOD_LABELS[c.method]} · {new Date(c.date).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
