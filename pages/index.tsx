import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { calcPolitica, OCUPACOES, EMPRESAS, ABRANGENCIAS } from '../lib/politica'

type Credencial = {
  id?: number
  crede: string
  usuario: string
  ocupacao: string
  especificacao: string
  empresa: string
  abrangencia: string
  placa: string
  credencial_fisica: string
  politica: string
  secao: string
  setor: string
  departamento: string
  area: string
  divisao: string
  unidade: string
  nucleo: string
  grupo: string
  reserva: string
}

const NIVEL_COLS = ['secao','setor','departamento','area','divisao','unidade','nucleo','grupo'] as const

function polColor(pol: string) {
  if (pol === 'TEM') return 'bg-green-100 text-green-800'
  if (pol === 'PODE SER') return 'bg-amber-100 text-amber-800'
  if (pol === 'NAO') return 'bg-red-100 text-red-800'
  return 'bg-gray-100 text-gray-500'
}

const EMPTY: Credencial = {
  crede:'', usuario:'', ocupacao:'', especificacao:'', empresa:'',
  abrangencia:'', placa:'', credencial_fisica:'', politica:'',
  secao:'', setor:'', departamento:'', area:'', divisao:'', unidade:'', nucleo:'', grupo:'', reserva:'NAO'
}

function exportToExcel(data: Credencial[]) {
  const headers = [
    'Credencial','Nome','Cargo','Especificação','Empresa','Abrangência',
    'Placa(s)','Credencial Física','Política','Seção','Setor','Departamento',
    'Área','Divisão','Unidade','Núcleo','Grupo','Status'
  ]
  const rows = data.map(r => [
    r.crede, r.usuario, r.ocupacao, r.especificacao, r.empresa, r.abrangencia,
    r.placa, r.credencial_fisica, r.politica, r.secao, r.setor, r.departamento,
    r.area, r.divisao, r.unidade, r.nucleo, r.grupo,
    r.reserva === 'SIM' ? 'RESERVA' : 'EM USO'
  ])
  const bom = '\uFEFF'
  const csv = bom + [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(';'))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `credenciais-mhs-${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<{usuario:string}|null>(null)
  const [credenciais, setCredenciais] = useState<Credencial[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [filtroCargo, setFiltroCargo] = useState('')
  const [filtroPol, setFiltroPol] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Credencial>(EMPTY)
  const [editId, setEditId] = useState<number|null>(null)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('mhs_token')
    const u = localStorage.getItem('mhs_user')
    if (!token || !u) { router.push('/login'); return }
    setUser(JSON.parse(u))
    fetchCredenciais(token)
  }, [])

  async function fetchCredenciais(token: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/credenciais', { headers: { Authorization: `Bearer ${token}` } })
      if (res.status === 401) { router.push('/login'); return }
      const data = await res.json()
      setCredenciais(data)
    } finally { setLoading(false) }
  }

  function logout() {
    localStorage.removeItem('mhs_token')
    localStorage.removeItem('mhs_user')
    router.push('/login')
  }

  const filtered = credenciais.filter(r => {
    const q = busca.toLowerCase()
    if (q && !`${r.crede} ${r.usuario} ${r.empresa} ${r.ocupacao} ${r.placa} ${r.especificacao}`.toLowerCase().includes(q)) return false
    if (filtroEmpresa && r.empresa !== filtroEmpresa) return false
    if (filtroCargo && r.ocupacao !== filtroCargo) return false
    if (filtroPol && r.politica !== filtroPol) return false
    return true
  })

  function openNew() {
    setForm(EMPTY); setEditId(null); setErro(''); setModal(true)
  }

  function openEdit(r: Credencial) {
    setForm({...r}); setEditId(r.id ?? null); setErro(''); setModal(true)
  }

  function handleFormChange(field: keyof Credencial, value: string) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'ocupacao') {
        const pol = calcPolitica(value)
        next.politica = pol
        NIVEL_COLS.forEach(col => { (next as any)[col] = pol })
      }
      return next
    })
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.crede) { setErro('Informe o número da credencial.'); return }
    setSaving(true); setErro('')
    try {
      const token = localStorage.getItem('mhs_token')
      const url = editId ? `/api/credenciais/${editId}` : '/api/credenciais'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao salvar'); return }
      setModal(false)
      fetchCredenciais(token!)
    } catch { setErro('Erro de conexão.') }
    finally { setSaving(false) }
  }

  async function excluir(id: number) {
    if (!confirm('Excluir esta credencial?')) return
    const token = localStorage.getItem('mhs_token')
    await fetch(`/api/credenciais/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    fetchCredenciais(token!)
  }

  const emUso = credenciais.filter(r => r.reserva !== 'SIM').length
  const reserva = credenciais.filter(r => r.reserva === 'SIM').length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Sistema de Credenciais</h1>
            <p className="text-xs text-gray-400">MHS 2025</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.usuario}</span>
          <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600">Sair</button>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="flex gap-3 mb-5 flex-wrap">
          {[
            { label: 'Total', val: credenciais.length, color: 'bg-blue-50 text-blue-700' },
            { label: 'Em uso', val: emUso, color: 'bg-green-50 text-green-700' },
            { label: 'Reserva', val: reserva, color: 'bg-gray-100 text-gray-600' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-xl px-4 py-2.5 flex gap-2 items-baseline`}>
              <span className="text-xl font-semibold">{s.val}</span>
              <span className="text-xs">{s.label}</span>
            </div>
          ))}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => exportToExcel(filtered)}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Exportar Excel
            </button>
            <button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
              + Nova credencial
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4 flex gap-2 flex-wrap">
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar nome, credencial, empresa, placa..."
            className="flex-1 min-w-48 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          <select value={filtroEmpresa} onChange={e=>setFiltroEmpresa(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
            <option value="">Todas empresas</option>
            {Array.from(new Set(credenciais.map(r=>r.empresa).filter(Boolean))).sort().map(e=><option key={e}>{e}</option>)}
          </select>
          <select value={filtroCargo} onChange={e=>setFiltroCargo(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
            <option value="">Todos cargos</option>
            {Array.from(new Set(credenciais.map(r=>r.ocupacao).filter(Boolean))).sort().map(c=><option key={c}>{c}</option>)}
          </select>
          <select value={filtroPol} onChange={e=>setFiltroPol(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
            <option value="">Toda política</option>
            <option value="TEM">TEM</option>
            <option value="PODE SER">PODE SER</option>
            <option value="NAO">NÃO</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-gray-400 text-sm">Carregando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Credencial','Nome','Cargo','Especificação','Empresa','Placa(s)','Política','Ações'].map(h=>(
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400">Nenhum resultado encontrado.</td></tr>
                  )}
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-semibold text-gray-900">{r.crede}</td>
                      <td className="px-4 py-3 max-w-[200px]">
                        {r.reserva === 'SIM'
                          ? <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-md">RESERVA</span>
                          : <span className="truncate block">{r.usuario || '—'}</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{r.ocupacao || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{r.especificacao || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{r.empresa || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{r.placa || '—'}</td>
                      <td className="px-4 py-3">
                        {r.politica
                          ? <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${polColor(r.politica)}`}>{r.politica}</span>
                          : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={()=>openEdit(r)} className="text-xs text-blue-600 hover:underline">Editar</button>
                          <button onClick={()=>r.id && excluir(r.id)} className="text-xs text-red-500 hover:underline">Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">{filtered.length} de {credenciais.length} credenciais</p>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editId ? `Credencial ${form.crede}` : 'Nova Credencial'}</h2>
              <button onClick={()=>setModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={salvar} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Credencial nova *</label>
                  <input value={form.crede} onChange={e=>handleFormChange('crede',e.target.value)} disabled={!!editId}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" placeholder="Ex: 7980"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
                  <select value={form.reserva} onChange={e=>handleFormChange('reserva',e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option value="NAO">Em uso</option><option value="SIM">Reserva</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Nome completo</label>
                <input value={form.usuario} onChange={e=>handleFormChange('usuario',e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nome do colaborador"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Cargo / Ocupação</label>
                  <select value={form.ocupacao} onChange={e=>handleFormChange('ocupacao',e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option value="">Selecione...</option>
                    {OCUPACOES.map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Especificação</label>
                  <input value={form.especificacao} onChange={e=>handleFormChange('especificacao',e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: ATENDIMENTO"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Empresa</label>
                  <select value={form.empresa} onChange={e=>handleFormChange('empresa',e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option value="">Selecione...</option>
                    {EMPRESAS.map(e=><option key={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Abrangência</label>
                  <select value={form.abrangencia} onChange={e=>handleFormChange('abrangencia',e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option value="">Selecione...</option>
                    {ABRANGENCIAS.map(a=><option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Placa(s)</label>
                  <input value={form.placa} onChange={e=>handleFormChange('placa',e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: ABC-1234"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Credencial física</label>
                  <select value={form.credencial_fisica} onChange={e=>handleFormChange('credencial_fisica',e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option value="">—</option><option value="SIM">SIM</option><option value="NÃO">NÃO</option>
                  </select>
                </div>
              </div>
              {form.ocupacao && (
                <div className={`rounded-lg px-4 py-3 text-sm font-medium ${polColor(form.politica)}`}>
                  Política automática: <strong>{form.politica || '—'}</strong>
                  {form.politica && <span className="font-normal ml-1">— aplica a todos os níveis</span>}
                </div>
              )}
              {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-60 transition">
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
