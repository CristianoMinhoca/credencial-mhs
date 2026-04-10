import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { usuario, senha } = req.body
  if (!usuario || !senha) return res.status(400).json({ error: 'Usuário e senha obrigatórios' })

  const { data: user, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('usuario', usuario.trim().toLowerCase())
    .single()

  if (error || !user) return res.status(401).json({ error: 'Usuário não encontrado' })

  const ok = await bcrypt.compare(senha, user.senha_hash)
  if (!ok) return res.status(401).json({ error: 'Senha incorreta' })

  const token = Buffer.from(`${user.id}:${Date.now()}:${process.env.TOKEN_SECRET}`).toString('base64')

  res.json({ token, user: { id: user.id, usuario: user.usuario } })
}
