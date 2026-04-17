import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function enviarEmail(to: string, subject: string, html: string) {
  return fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: { name: 'Credencial MHS', email: 'cristiano.uceda@grupoaguia.com.br' },
      to: [{ email: to }],
      subject,
      htmlContent: html
    })
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { acao, dados } = req.query
  if (!acao || !dados) return res.status(400).send('Parâmetros inválidos')

  let parsed: any
  try { parsed = JSON.parse(decodeURIComponent(dados as string)) }
  catch { return res.status(400).send('Dados inválidos') }

  const { email, usuario, ocupacao, especificacao, empresa, abrangencia, placa, credencial_fisica, politica } = parsed

  if (acao === 'negar') {
    await enviarEmail(email, 'Solicitação de credencial negada', `
      <h2 style="color:#dc2626">Solicitação de Credencial Negada</h2>
      <p>Olá <strong>${usuario}</strong>,</p>
      <p>Infelizmente sua solicitação de credencial foi <strong>negada</strong>.</p>
      <p>Em caso de dúvidas, entre em contato com o responsável.</p>
      <p style="color:#666;font-size:12px;margin-top:20px">MHS 2025 — Sistema de Credenciais</p>
    `)
    return res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2 style="color:#dc2626">❌ Solicitação negada</h2><p>E-mail de negação enviado para ${email}</p></body></html>`)
  }

  if (acao === 'aprovar') {
    const { data: reservas } = await supabase
      .from('credenciais')
      .select('*')
      .eq('reserva', 'SIM')
      .order('crede', { ascending: true })
      .limit(1)

    if (!reservas || reservas.length === 0) {
      return res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2 style="color:#f59e0b">⚠️ Sem credenciais disponíveis</h2><p>Não há credenciais em RESERVA disponíveis no momento.</p></body></html>`)
    }

    const reserva = reservas[0]

    await supabase.from('credenciais').update({
      usuario, ocupacao, especificacao, empresa, abrangencia,
      placa, credencial_fisica, politica,
      secao: politica, setor: politica, departamento: politica,
      area: politica, divisao: politica, unidade: politica,
      nucleo: politica, grupo: politica,
      reserva: 'NAO'
    }).eq('id', reserva.id)

    // E-mail para o solicitante
    await enviarEmail(email, 'Solicitação de credencial aprovada! ✅', `
      <h2 style="color:#16a34a">Solicitação de Credencial Aprovada! ✅</h2>
      <p>Olá <strong>${usuario}</strong>,</p>
      <p>Sua solicitação de credencial foi <strong>aprovada</strong>!</p>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;margin:20px 0">
        <tr><td><strong>Número da Credencial</strong></td><td><strong style="color:#1e40af;font-size:18px">${reserva.crede}</strong></td></tr>
        <tr><td><strong>Nome</strong></td><td>${usuario}</td></tr>
        <tr><td><strong>Cargo</strong></td><td>${ocupacao}</td></tr>
        <tr><td><strong>Empresa</strong></td><td>${empresa}</td></tr>
        <tr><td><strong>Política</strong></td><td>${politica}</td></tr>
      </table>
      <p style="color:#666;font-size:12px;margin-top:20px">MHS 2025 — Sistema de Credenciais</p>
    `)

    // E-mail para estacionamento
    await enviarEmail('estacionamento@cemhs.com.br', `Credencial aprovada - ${usuario}`, `
      <p>Olá,</p>
      <p>Tudo bem?</p>
      <p>Por gentileza, cadastrar na credencial <strong>${reserva.crede}</strong> a placa do carro <strong>${placa || '—'}</strong> e vincular ao nome <strong>${usuario}</strong>.</p>
      <br>
      <p>Grato,</p>
      <br>
      <hr>
      <p style="color:#666;font-size:12px">Detalhes completos:</p>
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:13px">
        <tr><td><strong>Credencial</strong></td><td>${reserva.crede}</td></tr>
        <tr><td><strong>Nome</strong></td><td>${usuario}</td></tr>
        <tr><td><strong>Cargo</strong></td><td>${ocupacao}</td></tr>
        <tr><td><strong>Especificação</strong></td><td>${especificacao || '—'}</td></tr>
        <tr><td><strong>Empresa</strong></td><td>${empresa}</td></tr>
        <tr><td><strong>Abrangência</strong></td><td>${abrangencia || '—'}</td></tr>
        <tr><td><strong>Placa(s)</strong></td><td>${placa || '—'}</td></tr>
        <tr><td><strong>Credencial Física</strong></td><td>${credencial_fisica || '—'}</td></tr>
        <tr><td><strong>Política</strong></td><td>${politica || '—'}</td></tr>
      </table>
      <p style="color:#666;font-size:12px;margin-top:20px">MHS 2025 — Sistema de Credenciais</p>
    `)

    return res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2 style="color:#16a34a">✅ Solicitação aprovada!</h2><p>Credencial <strong>${reserva.crede}</strong> atribuída para <strong>${usuario}</strong></p><p>E-mails de confirmação enviados.</p></body></html>`)
  }

  res.status(400).send('Ação inválida')
}
