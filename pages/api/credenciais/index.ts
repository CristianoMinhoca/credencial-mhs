import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

function calcPolitica(ocupacao: string): string {
  const map: Record<string, string> = {
    APRENDIZ: 'NAO', ESTAGIARIO: 'NAO', AUXILIAR: 'NAO',
    ASSISTENTE: 'PODE SER', ANALISTA: 'PODE SER', CONSULTOR: 'PODE SER',
    COORDENADOR: 'PODE SER', SUPERVISOR: 'PODE SER',
    GERENTE: 'TEM', DIRETOR: 'TEM', DIRETORA: 'TEM',
    PRESIDENTE: 'TEM', CEO: 'TEM', 'C-LEVEL': 'TEM',
  }
  return map[ocupacao?.toUpperCase()?.trim()] || ''
}

async function auth(req: NextApiRequest, res: NextApiResponse): Promise<boolean> {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) { res.status(401).json({ error: 'Não autorizado' }); return false }
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [userId] = decoded.split(':')
    const { data } = await supabase.from('usuarios').select('id').eq('id', parseInt(userId)).single()
    if (!data) { res.status(401).json({ error: 'Sessão inválida' }); return false }
    return true
  } catch { res.status(401).json({ error: 'Token inválido' }); return false }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ok = await auth(req, res)
  if (!ok) return

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('credenciais').select('*').order('crede')
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  if (req.method === 'POST') {
    const body = req.body
    const pol = calcPolitica(body.ocupacao || '')
    const record = {
      crede: body.crede, usuario: body.usuario, ocupacao: body.ocupacao,
      especificacao: body.especificacao, empresa: body.empresa, abrangencia: body.abrangencia,
      placa: body.placa, credencial_fisica: body.credencial_fisica, reserva: body.reserva,
      politica: pol, secao: pol, setor: pol, departamento: pol,
      area: pol, divisao: pol, unidade: pol, nucleo: pol, grupo: pol,
    }
    const { data, error } = await supabase.from('credenciais').insert(record).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.json(data)
  }

  res.status(405).end()
}
