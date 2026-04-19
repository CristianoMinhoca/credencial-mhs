import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cristiano.uceda@gmail.com',
    pass: process.env.GMAIL_PASS,
  },
})

async function enviarEmail(to: string, subject: string, html: string) {
  return transporter.sendMail({
    from: '"Credencial MHS" <cristiano.uceda@gmail.com>',
    to,
    replyTo: 'administrativo@grupoaguia.com.br',
    subject,
    html,
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, usuario, ocupacao, especificacao, empresa, abrangencia, placa, credencial_fisica, justificativa, politica } = req.body

  if (!email || !usuario || !ocupacao || !empresa) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' })
  }

  const dados = encodeURIComponent(JSON.stringify({ email, usuario, ocupacao, especificacao, empresa, abrangencia, placa, credencial_fisica, justificativa, politica }))
  const baseUrl = 'https://credencial-mhs.vercel.app'
  const linkAprovar = `${baseUrl}/api/aprovar?acao=aprovar&dados=${dados}`
  const linkNegar = `${baseUrl}/api/aprovar?acao=negar&dados=${dados}`

  const html = `
    <h2 style="color:#1e40af">Nova Solicitação de Credencial MHS 2025</h2>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;margin-bottom:20px">
      <tr><td><strong>Nome</strong></td><td>${usuario}</td></tr>
      <tr><td><strong>E-mail</strong></td><td>${email}</td></tr>
      <tr><td><strong>Cargo</strong></td><td>${ocupacao}</td></tr>
      <tr><td><strong>Especificação</strong></td><td>${especificacao || '—'}</td></tr>
      <tr><td><strong>Empresa</strong></td><td>${empresa}</td></tr>
      <tr><td><strong>Abrangência</strong></td><td>${abrangencia || '—'}</td></tr>
      <tr><td><strong>Placa(s)</strong></td><td>${placa || '—'}</td></tr>
      <tr><td><strong>Credencial Física</strong></td><td>${credencial_fisica || '—'}</td></tr>
      <tr><td><strong>Política</strong></td><td>${politica || '—'}</td></tr>
      <tr><td><strong>Justificativa</strong></td><td>${justificativa || '—'}</td></tr>
    </table>
    <div style="margin-top:24px">
      <a href="${linkAprovar}" style="background:#16a34a;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">✅ APROVAR</a>
      &nbsp;&nbsp;
      <a href="${linkNegar}" style="background:#dc2626;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">❌ NEGAR</a>
    </div>
    <p style="margin-top:20px;color:#666;font-size:12px">Clique em um dos botões acima para aprovar ou negar esta solicitação.</p>
  `

  const subject = `Nova solicitação de credencial - ${usuario}`

  try {
    await enviarEmail('administrativo@grupoaguia.com.br', subject, html)
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao enviar e-mail' })
  }
}
