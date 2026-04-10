import type { NextApiRequest, NextApiResponse } from 'next'
import { authMiddleware, supabase } from '../../lib/auth'
import { calcPolitica } from '../../lib/politica'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ok = await authMiddleware(req, res)
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
