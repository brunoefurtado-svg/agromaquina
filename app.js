const { useState, useEffect } = React;

// ── STORAGE HELPERS ────────────────────────────────────────────────────────────
function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const DEFAULT_MACHINES = [
  { id: 1, nome: "Trator John Deere 5075E", tipo: "Trator", horimetro: 1240, status: "ok" },
  { id: 2, nome: "Colheitadeira Case IH 8120", tipo: "Colheitadeira", horimetro: 890, status: "alerta" },
];
const DEFAULT_MANUTENCOES = [
  { id: 1, maquinaId: 1, tipo: "Preventiva", descricao: "Troca de óleo motor", data: "2026-05-10", proxHorimetro: 1500, status: "concluida", custo: 180 },
  { id: 2, maquinaId: 2, tipo: "Preventiva", descricao: "Revisão hidráulica", data: "2026-06-10", proxHorimetro: 950, status: "pendente", custo: 0 },
];
const DEFAULT_ESTOQUE = [
  { id: 1, nome: "Óleo Motor 15W40", quantidade: 8, unidade: "L", minimo: 5, categoria: "Lubrificantes" },
  { id: 2, nome: "Filtro de Ar", quantidade: 2, unidade: "un", minimo: 3, categoria: "Filtros" },
  { id: 3, nome: "Filtro de Óleo", quantidade: 4, unidade: "un", minimo: 3, categoria: "Filtros" },
];

// ── UI PRIMITIVES ──────────────────────────────────────────────────────────────
const statusConfig = {
  ok: { label: "OK", bg: "#1a3a1a", text: "#4ade80", dot: "#4ade80" },
  alerta: { label: "Alerta", bg: "#3a2a00", text: "#fbbf24", dot: "#fbbf24" },
  critico: { label: "Crítico", bg: "#3a0a0a", text: "#f87171", dot: "#f87171" },
};
const manutStatusConfig = {
  concluida: { label: "Concluída", color: "#4ade80" },
  pendente: { label: "Pendente", color: "#fbbf24" },
  em_andamento: { label: "Em andamento", color: "#60a5fa" },
};
const tipoIcon = { Trator: "🚜", Colheitadeira: "🌾", Pulverizador: "💧", Outro: "⚙️" };

function StatusDot({ status }) {
  const cfg = statusConfig[status] || statusConfig.ok;
  return React.createElement('span', {
    style: { display:"inline-flex", alignItems:"center", gap:5, background:cfg.bg, color:cfg.text, borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700, letterSpacing:"0.05em" }
  },
    React.createElement('span', { style:{ width:7, height:7, borderRadius:"50%", background:cfg.dot, display:"inline-block" } }),
    cfg.label
  );
}

function Card({ children, style={}, onClick }) {
  return React.createElement('div', { onClick, style:{ background:"#161f16", border:"1px solid #2a3d2a", borderRadius:14, padding:"14px 16px", marginBottom:12, cursor: onClick?"pointer":undefined, ...style } }, children);
}

function Modal({ title, onClose, children }) {
  return React.createElement('div', {
    style:{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center" },
    onClick: onClose
  },
    React.createElement('div', {
      style:{ background:"#0f1a0f", borderRadius:"20px 20px 0 0", padding:"24px 20px 40px", width:"100%", maxWidth:480, border:"1px solid #2a3d2a", borderBottom:"none", maxHeight:"88vh", overflowY:"auto" },
      onClick: e => e.stopPropagation()
    },
      React.createElement('div', { style:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 } },
        React.createElement('span', { style:{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:"#a3d977", letterSpacing:"0.05em" } }, title),
        React.createElement('button', { onClick:onClose, style:{ background:"none", border:"none", color:"#6b7c6b", fontSize:22, cursor:"pointer" } }, "✕")
      ),
      children
    )
  );
}

function Field({ label, children }) {
  return React.createElement('div', { style:{ marginBottom:14 } },
    label && React.createElement('label', { style:{ display:"block", fontSize:11, color:"#6b7c6b", marginBottom:5, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" } }, label),
    children
  );
}

const inputStyle = { width:"100%", background:"#1a2d1a", border:"1px solid #2a3d2a", borderRadius:10, padding:"10px 12px", color:"#c8e6c8", fontSize:14, outline:"none", boxSizing:"border-box" };

function Input({ label, ...props }) {
  return React.createElement(Field, { label },
    React.createElement('input', { style: inputStyle, ...props })
  );
}

function Select({ label, children, ...props }) {
  return React.createElement(Field, { label },
    React.createElement('select', { style: inputStyle, ...props }, children)
  );
}

function Btn({ children, variant="primary", style={}, ...props }) {
  const variants = {
    primary: { background:"#4a7c4a", color:"#fff", border:"none" },
    ghost: { background:"transparent", color:"#a3d977", border:"1px solid #2a3d2a" },
    danger: { background:"#7c1a1a", color:"#fff", border:"none" },
  };
  return React.createElement('button', {
    style:{ padding:"11px 18px", borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer", letterSpacing:"0.03em", ...variants[variant], ...style },
    ...props
  }, children);
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────────
function Dashboard({ machines, manutencoes, estoque, onNav }) {
  const criticos = machines.filter(m => m.status === "critico").length;
  const pendentes = manutencoes.filter(m => m.status === "pendente").length;
  const estoqueAbaixo = estoque.filter(e => e.quantidade < e.minimo).length;
  const hoje = new Date().toISOString().split("T")[0];
  const vencidas = manutencoes.filter(m => m.status === "pendente" && m.data <= hoje).length;

  const h = e => React.createElement;
  return h('div', null,
    h('div', { style:{ marginBottom:20 } },
      h('div', { style:{ fontSize:13, color:"#6b7c6b", marginBottom:2 } }, "Visão geral"),
      h('div', { style:{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:"#a3d977", letterSpacing:"0.05em" } }, "FAZENDA")
    ),
    (criticos > 0 || vencidas > 0) && h('div', {
      style:{ background:"#3a0a0a", border:"1px solid #7c1a1a", borderRadius:12, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }
    },
      h('span', { style:{ fontSize:18 } }, "🚨"),
      h('div', null,
        h('div', { style:{ color:"#f87171", fontWeight:700, fontSize:13 } }, "Atenção necessária"),
        h('div', { style:{ color:"#a07070", fontSize:12 } },
          (criticos > 0 ? `${criticos} máquina(s) crítica(s). ` : "") +
          (vencidas > 0 ? `${vencidas} manutenção(ões) vencida(s).` : "")
        )
      )
    ),
    h('div', { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 } },
      ...[
        { label:"Máquinas", value:machines.length, icon:"🚜", sub:`${criticos} críticas`, color: criticos>0?"#f87171":"#4ade80", nav:"machines" },
        { label:"Manutenções", value:pendentes, icon:"🔧", sub:`${vencidas} vencidas`, color: vencidas>0?"#fbbf24":"#4ade80", nav:"manutencoes" },
        { label:"Estoque baixo", value:estoqueAbaixo, icon:"📦", sub:"itens abaixo mín.", color: estoqueAbaixo>0?"#fbbf24":"#4ade80", nav:"estoque" },
        { label:"Em andamento", value:manutencoes.filter(m=>m.status==="em_andamento").length, icon:"⚙️", sub:"serviços ativos", color:"#60a5fa", nav:"manutencoes" },
      ].map(kpi => h(Card, { key:kpi.label, onClick:()=>onNav(kpi.nav), style:{ padding:16 } },
        h('div', { style:{ fontSize:22, marginBottom:6 } }, kpi.icon),
        h('div', { style:{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:kpi.color, lineHeight:1 } }, kpi.value),
        h('div', { style:{ fontSize:12, color:"#c8e6c8", fontWeight:600, marginTop:2 } }, kpi.label),
        h('div', { style:{ fontSize:11, color:"#6b7c6b", marginTop:2 } }, kpi.sub)
      ))
    ),
    h('div', { style:{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:"#a3d977", letterSpacing:"0.05em", marginBottom:10 } }, "PRÓXIMAS MANUTENÇÕES"),
    ...manutencoes.filter(m => m.status==="pendente").slice(0,4).map(m => {
      const maq = machines.find(ma => ma.id === m.maquinaId);
      const vencida = m.data <= hoje;
      return h(Card, { key:m.id, style:{ display:"flex", alignItems:"center", gap:12 } },
        h('span', { style:{ fontSize:24 } }, tipoIcon[maq?.tipo] || "⚙️"),
        h('div', { style:{ flex:1 } },
          h('div', { style:{ color:"#c8e6c8", fontWeight:600, fontSize:13 } }, m.descricao),
          h('div', { style:{ color:"#6b7c6b", fontSize:11 } }, maq?.nome)
        ),
        h('div', { style:{ fontSize:11, color: vencida?"#f87171":"#fbbf24", fontWeight:700 } }, vencida ? "VENCIDA" : m.data)
      );
    })
  );
}

// ── MACHINES ──────────────────────────────────────────────────────────────────
function Machines({ machines, setMachines, manutencoes }) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nome:"", tipo:"Trator", horimetro:"", status:"ok" });
  const h = React.createElement;

  const openNew = () => { setEditing(null); setForm({ nome:"", tipo:"Trator", horimetro:"", status:"ok" }); setModal(true); };
  const openEdit = (m) => { setEditing(m.id); setForm({ nome:m.nome, tipo:m.tipo, horimetro:String(m.horimetro), status:m.status }); setModal(true); };

  const save = () => {
    if (!form.nome || !form.horimetro) return;
    if (editing) {
      setMachines(prev => prev.map(m => m.id === editing ? { ...m, ...form, horimetro: Number(form.horimetro) } : m));
    } else {
      setMachines(prev => [...prev, { ...form, id: Date.now(), horimetro: Number(form.horimetro) }]);
    }
    setModal(false);
  };

  const remove = (id) => { if (confirm("Remover esta máquina?")) setMachines(prev => prev.filter(m => m.id !== id)); };

  return h('div', null,
    h('div', { style:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 } },
      h('div', { style:{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:"#a3d977", letterSpacing:"0.05em" } }, "MÁQUINAS"),
      h(Btn, { onClick:openNew, style:{ padding:"8px 14px", fontSize:13 } }, "+ Adicionar")
    ),
    ...machines.map(m => {
      const manut = manutencoes.filter(mn => mn.maquinaId === m.id);
      const ultima = manut.filter(mn=>mn.status==="concluida").sort((a,b)=>b.data.localeCompare(a.data))[0];
      return h(Card, { key:m.id },
        h('div', { style:{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 } },
          h('div', { style:{ display:"flex", alignItems:"center", gap:10 } },
            h('span', { style:{ fontSize:28 } }, tipoIcon[m.tipo] || "⚙️"),
            h('div', null,
              h('div', { style:{ color:"#e8f5e8", fontWeight:700, fontSize:14 } }, m.nome),
              h('div', { style:{ color:"#6b7c6b", fontSize:11 } }, m.tipo)
            )
          ),
          h(StatusDot, { status:m.status })
        ),
        h('div', { style:{ display:"flex", gap:16, marginBottom:12 } },
          h('div', null,
            h('div', { style:{ color:"#6b7c6b", fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em" } }, "Horímetro"),
            h('div', { style:{ color:"#a3d977", fontFamily:"'Bebas Neue',sans-serif", fontSize:20 } }, `${m.horimetro.toLocaleString("pt-BR")} h`)
          ),
          h('div', null,
            h('div', { style:{ color:"#6b7c6b", fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em" } }, "Última manut."),
            h('div', { style:{ color:"#c8e6c8", fontSize:13, fontWeight:600, marginTop:2 } }, ultima?.data || "—")
          ),
          h('div', null,
            h('div', { style:{ color:"#6b7c6b", fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em" } }, "Registros"),
            h('div', { style:{ color:"#c8e6c8", fontSize:13, fontWeight:600, marginTop:2 } }, manut.length)
          )
        ),
        h('div', { style:{ display:"flex", gap:8 } },
          h(Btn, { variant:"ghost", style:{ fontSize:11, padding:"6px 12px" }, onClick:()=>openEdit(m) }, "✏ Editar"),
          h(Btn, { variant:"danger", style:{ fontSize:11, padding:"6px 12px" }, onClick:()=>remove(m.id) }, "🗑 Remover")
        )
      );
    }),
    modal && h(Modal, { title: editing ? "EDITAR MÁQUINA" : "NOVA MÁQUINA", onClose:()=>setModal(false) },
      h(Input, { label:"Nome da máquina", value:form.nome, onChange:e=>setForm(p=>({...p,nome:e.target.value})), placeholder:"Ex: Trator John Deere 5075E" }),
      h(Select, { label:"Tipo", value:form.tipo, onChange:e=>setForm(p=>({...p,tipo:e.target.value})) },
        h('option',null,"Trator"), h('option',null,"Colheitadeira"), h('option',null,"Pulverizador"), h('option',null,"Outro")
      ),
      h(Input, { label:"Horímetro atual (h)", type:"number", value:form.horimetro, onChange:e=>setForm(p=>({...p,horimetro:e.target.value})), placeholder:"0" }),
      h(Select, { label:"Status", value:form.status, onChange:e=>setForm(p=>({...p,status:e.target.value})) },
        h('option',{value:"ok"},"OK"), h('option',{value:"alerta"},"Alerta"), h('option',{value:"critico"},"Crítico")
      ),
      h('div', { style:{ display:"flex", gap:10, marginTop:8 } },
        h(Btn, { onClick:save, style:{ flex:1 } }, "Salvar"),
        h(Btn, { variant:"ghost", onClick:()=>setModal(false), style:{ flex:1 } }, "Cancelar")
      )
    )
  );
}

// ── MANUTENÇÕES ────────────────────────────────────────────────────────────────
function Manutencoes({ manutencoes, setManutencoes, machines }) {
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState("todos");
  const [form, setForm] = useState({ maquinaId:"", tipo:"Preventiva", descricao:"", data:"", proxHorimetro:"", status:"pendente", custo:"" });
  const h = React.createElement;

  const filtered = filter === "todos" ? manutencoes : manutencoes.filter(m => m.status === filter);

  const save = () => {
    if (!form.maquinaId || !form.descricao || !form.data) return;
    setManutencoes(prev => [...prev, { ...form, id:Date.now(), maquinaId:Number(form.maquinaId), custo:Number(form.custo)||0, proxHorimetro:form.proxHorimetro?Number(form.proxHorimetro):null }]);
    setForm({ maquinaId:"", tipo:"Preventiva", descricao:"", data:"", proxHorimetro:"", status:"pendente", custo:"" });
    setModal(false);
  };

  const updateStatus = (id, status) => setManutencoes(prev => prev.map(m => m.id===id ? {...m,status} : m));
  const remove = (id) => { if(confirm("Remover este registro?")) setManutencoes(prev => prev.filter(m => m.id!==id)); };

  const filters = [
    {key:"todos",label:"Todos"},{key:"pendente",label:"Pendente"},{key:"em_andamento",label:"Andamento"},{key:"concluida",label:"Concluída"}
  ];

  return h('div', null,
    h('div', { style:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 } },
      h('div', { style:{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:"#a3d977", letterSpacing:"0.05em" } }, "MANUTENÇÕES"),
      h(Btn, { onClick:()=>setModal(true), style:{ padding:"8px 14px", fontSize:13 } }, "+ Novo")
    ),
    h('div', { style:{ display:"flex", gap:6, marginBottom:16, overflowX:"auto", paddingBottom:4 } },
      ...filters.map(f => h('button', {
        key:f.key, onClick:()=>setFilter(f.key),
        style:{ padding:"6px 14px", borderRadius:20, border:"1px solid", borderColor:filter===f.key?"#4a7c4a":"#2a3d2a", background:filter===f.key?"#4a7c4a":"transparent", color:filter===f.key?"#fff":"#6b7c6b", fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }
      }, f.label))
    ),
    ...filtered.map(m => {
      const maq = machines.find(ma => ma.id===m.maquinaId);
      const sc = manutStatusConfig[m.status];
      const hoje = new Date().toISOString().split("T")[0];
      const vencida = m.status==="pendente" && m.data <= hoje;
      return h(Card, { key:m.id, style:{ borderColor: vencida?"#7c3a00":"#2a3d2a" } },
        h('div', { style:{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 } },
          h('div', { style:{ flex:1 } },
            h('div', { style:{ color:"#e8f5e8", fontWeight:700, fontSize:14 } }, m.descricao),
            h('div', { style:{ color:"#6b7c6b", fontSize:11, marginTop:2 } }, `${maq?.nome||"—"} · ${m.tipo}`)
          ),
          h('span', { style:{ fontSize:11, color:sc.color, fontWeight:700, padding:"3px 8px", border:`1px solid ${sc.color}33`, borderRadius:20, marginLeft:8, whiteSpace:"nowrap" } }, sc.label)
        ),
        h('div', { style:{ display:"flex", gap:16, marginBottom:10, flexWrap:"wrap" } },
          h('div', null,
            h('div', { style:{ color:"#6b7c6b", fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase" } }, "Data"),
            h('div', { style:{ color: vencida?"#f87171":"#c8e6c8", fontSize:12, fontWeight:600 } }, m.data + (vencida?" ⚠":""))
          ),
          m.proxHorimetro && h('div', null,
            h('div', { style:{ color:"#6b7c6b", fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase" } }, "Próx. hora"),
            h('div', { style:{ color:"#a3d977", fontSize:12, fontWeight:700 } }, `${m.proxHorimetro}h`)
          ),
          m.custo>0 && h('div', null,
            h('div', { style:{ color:"#6b7c6b", fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase" } }, "Custo"),
            h('div', { style:{ color:"#c8e6c8", fontSize:12, fontWeight:600 } }, `R$ ${m.custo}`)
          )
        ),
        h('div', { style:{ display:"flex", gap:8 } },
          m.status==="pendente" && h(Btn, { variant:"ghost", style:{ fontSize:11, padding:"6px 12px" }, onClick:()=>updateStatus(m.id,"em_andamento") }, "▶ Iniciar"),
          m.status==="em_andamento" && h(Btn, { style:{ fontSize:11, padding:"6px 12px", background:"#1a4a1a" }, onClick:()=>updateStatus(m.id,"concluida") }, "✓ Concluir"),
          h(Btn, { variant:"danger", style:{ fontSize:11, padding:"6px 12px" }, onClick:()=>remove(m.id) }, "🗑")
        )
      );
    }),
    modal && h(Modal, { title:"NOVA MANUTENÇÃO", onClose:()=>setModal(false) },
      h(Select, { label:"Máquina", value:form.maquinaId, onChange:e=>setForm(p=>({...p,maquinaId:e.target.value})) },
        h('option',{value:""},"Selecione..."),
        ...machines.map(m => h('option',{key:m.id,value:m.id},m.nome))
      ),
      h(Select, { label:"Tipo", value:form.tipo, onChange:e=>setForm(p=>({...p,tipo:e.target.value})) },
        h('option',null,"Preventiva"), h('option',null,"Corretiva"), h('option',null,"Preditiva")
      ),
      h(Input, { label:"Descrição do serviço", value:form.descricao, onChange:e=>setForm(p=>({...p,descricao:e.target.value})), placeholder:"Ex: Troca de óleo motor" }),
      h(Input, { label:"Data prevista", type:"date", value:form.data, onChange:e=>setForm(p=>({...p,data:e.target.value})) }),
      h(Input, { label:"Próximo horímetro (h) — opcional", type:"number", value:form.proxHorimetro, onChange:e=>setForm(p=>({...p,proxHorimetro:e.target.value})), placeholder:"Ex: 1500" }),
      h(Input, { label:"Custo (R$) — opcional", type:"number", value:form.custo, onChange:e=>setForm(p=>({...p,custo:e.target.value})), placeholder:"0" }),
      h('div', { style:{ display:"flex", gap:10, marginTop:8 } },
        h(Btn, { onClick:save, style:{ flex:1 } }, "Salvar"),
        h(Btn, { variant:"ghost", onClick:()=>setModal(false), style:{ flex:1 } }, "Cancelar")
      )
    )
  );
}

// ── ESTOQUE ────────────────────────────────────────────────────────────────────
function Estoque({ estoque, setEstoque }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nome:"", quantidade:"", unidade:"un", minimo:"", categoria:"Filtros" });
  const h = React.createElement;

  const save = () => {
    if (!form.nome || !form.quantidade) return;
    setEstoque(prev => [...prev, { ...form, id:Date.now(), quantidade:Number(form.quantidade), minimo:Number(form.minimo)||0 }]);
    setForm({ nome:"", quantidade:"", unidade:"un", minimo:"", categoria:"Filtros" });
    setModal(false);
  };

  const adjust = (id, delta) => setEstoque(prev => prev.map(e => e.id===id ? {...e, quantidade:Math.max(0,e.quantidade+delta)} : e));
  const remove = (id) => { if(confirm("Remover este item?")) setEstoque(prev => prev.filter(e => e.id!==id)); };

  return h('div', null,
    h('div', { style:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 } },
      h('div', { style:{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:"#a3d977", letterSpacing:"0.05em" } }, "ESTOQUE"),
      h(Btn, { onClick:()=>setModal(true), style:{ padding:"8px 14px", fontSize:13 } }, "+ Item")
    ),
    ...estoque.map(e => {
      const baixo = e.quantidade < e.minimo;
      return h(Card, { key:e.id, style:{ borderColor: baixo?"#7c3a00":"#2a3d2a" } },
        h('div', { style:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: baixo?6:0 } },
          h('div', { style:{ flex:1 } },
            h('div', { style:{ color:"#e8f5e8", fontWeight:700, fontSize:14 } }, e.nome),
            h('div', { style:{ color:"#6b7c6b", fontSize:11 } }, e.categoria),
            baixo && h('div', { style:{ color:"#fbbf24", fontSize:11, marginTop:3 } }, `⚠ Mínimo: ${e.minimo} ${e.unidade}`)
          ),
          h('div', { style:{ display:"flex", alignItems:"center", gap:8 } },
            h('button', { onClick:()=>adjust(e.id,-1), style:{ width:32, height:32, borderRadius:8, background:"#1a2d1a", border:"1px solid #2a3d2a", color:"#c8e6c8", fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" } }, "−"),
            h('div', { style:{ textAlign:"center", minWidth:50 } },
              h('div', { style:{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:baixo?"#fbbf24":"#a3d977", lineHeight:1 } }, e.quantidade),
              h('div', { style:{ fontSize:10, color:"#6b7c6b" } }, e.unidade)
            ),
            h('button', { onClick:()=>adjust(e.id,1), style:{ width:32, height:32, borderRadius:8, background:"#1a2d1a", border:"1px solid #2a3d2a", color:"#c8e6c8", fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" } }, "+")
          )
        ),
        h('div', { style:{ display:"flex", justifyContent:"flex-end", marginTop:8 } },
          h(Btn, { variant:"danger", style:{ fontSize:11, padding:"5px 10px" }, onClick:()=>remove(e.id) }, "🗑 Remover")
        )
      );
    }),
    modal && h(Modal, { title:"NOVO ITEM", onClose:()=>setModal(false) },
      h(Input, { label:"Nome do item", value:form.nome, onChange:e=>setForm(p=>({...p,nome:e.target.value})), placeholder:"Ex: Filtro de Ar" }),
      h(Select, { label:"Categoria", value:form.categoria, onChange:e=>setForm(p=>({...p,categoria:e.target.value})) },
        h('option',null,"Filtros"), h('option',null,"Lubrificantes"), h('option',null,"Correias"), h('option',null,"Rolamentos"), h('option',null,"Outros")
      ),
      h('div', { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 } },
        h(Input, { label:"Quantidade", type:"number", value:form.quantidade, onChange:e=>setForm(p=>({...p,quantidade:e.target.value})), placeholder:"0" }),
        h(Select, { label:"Unidade", value:form.unidade, onChange:e=>setForm(p=>({...p,unidade:e.target.value})) },
          h('option',null,"un"), h('option',null,"L"), h('option',null,"kg"), h('option',null,"m")
        )
      ),
      h(Input, { label:"Estoque mínimo", type:"number", value:form.minimo, onChange:e=>setForm(p=>({...p,minimo:e.target.value})), placeholder:"0" }),
      h('div', { style:{ display:"flex", gap:10, marginTop:8 } },
        h(Btn, { onClick:save, style:{ flex:1 } }, "Salvar"),
        h(Btn, { variant:"ghost", onClick:()=>setModal(false), style:{ flex:1 } }, "Cancelar")
      )
    )
  );
}

// ── APP SHELL ──────────────────────────────────────────────────────────────────
function App() {
  const [tab, setTab] = useState("dashboard");
  const [machines, setMachinesRaw] = useState(() => load("machines", DEFAULT_MACHINES));
  const [manutencoes, setManutencoesRaw] = useState(() => load("manutencoes", DEFAULT_MANUTENCOES));
  const [estoque, setEstoqueRaw] = useState(() => load("estoque", DEFAULT_ESTOQUE));

  const setMachines = v => { const next = typeof v === "function" ? v(machines) : v; setMachinesRaw(next); save("machines", next); };
  const setManutencoes = v => { const next = typeof v === "function" ? v(manutencoes) : v; setManutencoesRaw(next); save("manutencoes", next); };
  const setEstoque = v => { const next = typeof v === "function" ? v(estoque) : v; setEstoqueRaw(next); save("estoque", next); };

  const tabs = [
    { key:"dashboard", icon:"◉", label:"Início" },
    { key:"machines", icon:"🚜", label:"Máquinas" },
    { key:"manutencoes", icon:"🔧", label:"Manutenção" },
    { key:"estoque", icon:"📦", label:"Estoque" },
  ];

  const h = React.createElement;
  return h('div', { style:{ maxWidth:480, margin:"0 auto", background:"#0a120a", minHeight:"100vh", position:"relative" } },
    // Header
    h('div', { style:{ padding:"20px 20px 8px", background:"#0a120a", position:"sticky", top:0, zIndex:50, borderBottom:"1px solid #1a2d1a" } },
      h('div', { style:{ display:"flex", alignItems:"center", gap:10 } },
        h('div', { style:{ width:32, height:32, borderRadius:8, background:"#4a7c4a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 } }, "🌿"),
        h('div', null,
          h('div', { style:{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:"#a3d977", letterSpacing:"0.1em", lineHeight:1 } }, "AGROMÁQUINAS"),
          h('div', { style:{ fontSize:10, color:"#4a6b4a", letterSpacing:"0.05em" } }, "CONTROLE DE MANUTENÇÃO")
        )
      )
    ),
    // Content
    h('div', { style:{ padding:"20px 16px 100px" } },
      tab==="dashboard" && h(Dashboard, { machines, manutencoes, estoque, onNav:setTab }),
      tab==="machines" && h(Machines, { machines, setMachines, manutencoes }),
      tab==="manutencoes" && h(Manutencoes, { manutencoes, setManutencoes, machines }),
      tab==="estoque" && h(Estoque, { estoque, setEstoque })
    ),
    // Bottom Nav
    h('div', { style:{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#0d1a0d", borderTop:"1px solid #1a2d1a", display:"flex", padding:"10px 0 24px" } },
      ...tabs.map(t => h('button', {
        key:t.key, onClick:()=>setTab(t.key),
        style:{ flex:1, background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4, color: tab===t.key?"#a3d977":"#4a6b4a" }
      },
        h('span', { style:{ fontSize:20 } }, t.icon),
        h('span', { style:{ fontSize:10, fontWeight: tab===t.key?700:500, letterSpacing:"0.04em" } }, t.label)
      ))
    )
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(React.createElement(App));
