import { useState } from 'react'

const POLITICA_MAP: Record<string, string> = {
  APRENDIZ:'NAO',ESTAGIARIO:'NAO',AUXILIAR:'NAO',ASSISTENTE:'PODE SER',ANALISTA:'PODE SER',CONSULTOR:'PODE SER',COORDENADOR:'PODE SER',SUPERVISOR:'PODE SER',FAMILIA:'PODE SER',GERENTE:'TEM',DIRETOR:'TEM',DIRETORA:'TEM',PRESIDENTE:'TEM',CEO:'TEM','C-LEVEL':'TEM',
}
const OCUPACOES = ['APRENDIZ','ESTAGIARIO','AUXILIAR','ASSISTENTE','ANALISTA','CONSULTOR','COORDENADOR','SUPERVISOR','FAMILIA','GERENTE','DIRETOR','DIRETORA','PRESIDENTE','CEO','C-LEVEL','MOTORISTA','FOWA','SPORTFIVE -SALA 501','CEO DO CONSELHO']
const EMPRESAS = ['CSC','PALLAS','4BTS','SEDE-MHS','NESTTRAVEL','TORCIDA BRASIL','SBT','SPORTFIVE','FOWA']
const ABRANGENCIAS = ['SEÇÃO','SETOR','DEPARTAMENTO','ÁREA','DIVISÃO','UNIDADE','NUCLEO','GRUPO','GRUPO ÁGUIA','FOWA']

export default function Solicitar() {
  const [form, setForm] = useState({email:'',usuario:'',ocupacao:'',especificacao:'',empresa:'',abrangencia:'',placa:'',veiculo:'',justificativa:''})
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const politica = POLITICA_MAP[form.ocupacao?.toUpperCase()?.trim()] || ''
  const credencial_fisica = form.veiculo === 'MOTO' ? 'SIM' : form.veiculo === 'CARRO' ? 'NÃO' : ''

  function handleChange(field: string, value: string) {
    const upper = ['usuario','especificacao','placa','justificativa']
    setForm(prev=>({...prev,[field]: upper.includes(field) ? value.toUpperCase() : value}))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email||!form.usuario||!form.ocupacao||!form.empresa) { setErro('Preencha os campos obrigatórios: E-mail do Gestor, Nome, Cargo e Empresa.'); return }
    setLoading(true); setErro('')
    try {
      const res = await fetch('/api/solicitar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form, credencial_fisica, politica})})
      if (!res.ok) { setErro('Erro ao enviar. Tente novamente.'); return }
      setEnviado(true)
    } catch { setErro('Erro de conexão. Tente novamente.') }
    finally { setLoading(false) }
  }

  if (enviado) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center shadow-sm">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Solicitação enviada!</h2>
        <p className="text-gray-500 text-sm">Sua solicitação foi recebida e será analisada. Você receberá uma resposta no e-mail informado.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Solicitação de Credencial</h1>
          <p className="text-gray-500 text-sm mt-1">MHS 2025 — Preencha todos os campos para solicitar sua credencial</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">E-mail do Gestor *</label>
              <input type="email" value={form.email} onChange={e=>handleChange('email',e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="email.do.gestor@empresa.com"/>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Nome completo de quem vai utilizar a credencial *</label>
              <input value={form.usuario} onChange={e=>handleChange('usuario',e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="NOME COMPLETO"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Cargo / Ocupação *</label>
                <select value={form.ocupacao} onChange={e=>handleChange('ocupacao',e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none">
                  <option value="">Selecione...</option>
                  {OCUPACOES.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Especificação</label>
                <input value={form.especificacao} onChange={e=>handleChange('especificacao',e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="EX: ATENDIMENTO"/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Empresa *</label>
                <select value={form.empresa} onChange={e=>handleChange('empresa',e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none">
                  <option value="">Selecione...</option>
                  {EMPRESAS.map(e=><option key={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Abrangência</label>
                <select value={form.abrangencia} onChange={e=>handleChange('abrangencia',e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none">
                  <option value="">Selecione...</option>
                  {ABRANGENCIAS.map(a=><option key={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Placa(s)</label>
                <input value={form.placa} onChange={e=>handleChange('placa',e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="EX: ABC-1234"/>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Tipo de veículo</label>
                <select value={form.veiculo} onChange={e=>handleChange('veiculo',e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none">
                  <option value="">Selecione...</option>
                  <option value="CARRO">CARRO</option>
                  <option value="MOTO">MOTO</option>
                </select>
              </div>
            </div>

            {form.veiculo && (
              <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-800">
                Credencial física: <strong>{credencial_fisica}</strong>
                {form.veiculo === 'MOTO' ? ' — Moto recebe credencial física' : ' — Carro não recebe credencial física'}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Justificativa</label>
              <textarea value={form.justificativa} onChange={e=>handleChange('justificativa',e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={3} placeholder="MOTIVO DA SOLICITAÇÃO..."/>
            </div>

            {politica&&(
              <div className={`rounded-lg px-4 py-3 text-sm font-medium ${politica==='TEM'?'bg-green-100 text-green-800':politica==='PODE SER'?'bg-amber-100 text-amber-800':'bg-red-100 text-red-800'}`}>
                Política para este cargo: <strong>{politica}</strong>
              </div>
            )}

            {erro&&<p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-60">
              {loading?'Enviando...':'Enviar solicitação'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
