import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function authMiddleware(req: NextApiRequest, res: NextApiResponse): Promise<boolean> {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) { res.status(401).json({ error: 'Não autorizado' }); return false }
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [userId] = decoded.split(':')
    const { data } = await supabase.from('usuarios').select('id').eq('id', parseInt(userId)).single()
    if (!data) { res.status(401).json({ error: 'Sessão inválida' }); return false }
    return true
  } catch {
    res.status(401).json({ error: 'Token inválido' }); return false
  }
}

export { supabase }
