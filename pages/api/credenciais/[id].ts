import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

function calcPolitica(ocupacao: string): string {
  const map: Record<string, string> = {
    APRENDIZ:'NAO',ESTAGIARIO:'NAO',AUXILIAR:'NAO',ASSISTENTE:'PODE SER',ANALISTA:'PODE SER',CONSULTOR:'PODE SER',COORDENADOR:'PODE SER',SUPERVISOR:'PODE SER',FAMILIA:'PODE SER',GERENTE:'TEM',DIRETOR:'TEM',DIRETORA:'TEM',PRESIDENTE:'TEM',CEO:'TEM','C-LEVEL':'TEM',
  }
  return map[ocupacao?.toUpperCase()?.trim()] || ''
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Não autorizado' })
  const id = parseInt(req.query.id as string)

  if (req.method === 'PUT') {
    const body = req.body
    const pol = calcPolitica(body.ocupacao || '')
    const record = {
      usuario: body.usuario, ocupacao: body.ocupacao, especificacao: body.especificacao,
      empresa: body.empresa, abrangencia: body.abrangencia, placa: body.placa,
      credencial_fisica: body.credencial_fisica, reserva: body.reserva,
      politica: pol, secao: pol, setor: pol, departamento: pol,
      area: pol, divisao: pol, unidade: pol, nucleo: pol, grupo: pol,
    }
    const { data, error } = await supabase.from('credenciais').update(record).eq('id', id).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.json(data)
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('credenciais').delete().eq('id', id)
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ ok: true })
  }

  res.status(405).end()
}
