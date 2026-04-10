import type { NextApiRequest, NextApiResponse } from 'next'
import { authMiddleware, supabase } from '../../../lib/auth'
import { calcPolitica } from '../../../lib/politica'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ok = await authMiddleware(req, res)
  if (!ok) return

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
