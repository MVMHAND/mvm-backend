import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

// Email configuration
const FROM_EMAIL = 'My Virtual Mate <onboarding@resend.dev>' // Update with your verified domain
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Brand colors for email templates
const BRAND_COLORS = {
  blue: '#025fc7',
  yellow: '#ba9309',
  gray: '#6b7280',
  dark: '#1f2937',
  light: '#f9fafb',
}

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

/**
 * Send email using Resend
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<{
  success: boolean
  error?: string
  messageId?: string
}> {
  try {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured')
      return {
        success: false,
        error: 'Email service not configured. Please add RESEND_API_KEY to environment variables.',
      }
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || extractTextFromHtml(html),
    })

    if (error) {
      console.error('Resend error:', error)
      return {
        success: false,
        error: error.message || 'Failed to send email',
      }
    }

    console.log('Email sent successfully:', data?.id)
    return {
      success: true,
      messageId: data?.id,
    }
  } catch (error) {
    console.error('Email send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send invitation email to new user
 */
export async function sendInvitationEmail(params: {
  to: string
  userName: string
  inviterName: string
  setupLink: string
}): Promise<{ success: boolean; error?: string }> {
  const { to, userName, inviterName, setupLink } = params

  const html = getInvitationEmailTemplate({
    userName,
    inviterName,
    setupLink,
  })

  return sendEmail({
    to,
    subject: "You've been invited to My Virtual Mate",
    html,
  })
}

/**
 * Send alert email to Super Admin
 */
export async function sendAdminAlertEmail(params: {
  to: string
  subject: string
  message: string
  actionType: string
  metadata?: Record<string, unknown>
}): Promise<{ success: boolean; error?: string }> {
  const { to, subject, message, actionType, metadata } = params

  const html = getAlertEmailTemplate({
    subject,
    message,
    actionType,
    metadata,
  })

  return sendEmail({
    to,
    subject: `[MVM Alert] ${subject}`,
    html,
  })
}

/**
 * Extract plain text from HTML (simple version)
 */
function extractTextFromHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*<\/style>/gm, '')
    .replace(/<script[^>]*>.*<\/script>/gm, '')
    .replace(/<[^>]+>/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Get base email template wrapper
 */
function getEmailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Virtual Mate</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f9fafb;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, ${BRAND_COLORS.blue} 0%, ${BRAND_COLORS.yellow} 100%);
      padding: 30px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      color: white;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      background: white;
      padding: 40px 30px;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: ${BRAND_COLORS.blue};
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #014a9e;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: ${BRAND_COLORS.gray};
      font-size: 12px;
    }
    .metadata {
      background-color: ${BRAND_COLORS.light};
      padding: 15px;
      border-left: 4px solid ${BRAND_COLORS.blue};
      margin: 15px 0;
      font-size: 14px;
    }
    @media only screen and (max-width: 600px) {
      .container {
        padding: 10px;
      }
      .content {
        padding: 25px 15px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>My Virtual Mate</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} My Virtual Mate. All rights reserved.</p>
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Invitation email template
 */
function getInvitationEmailTemplate(params: {
  userName: string
  inviterName: string
  setupLink: string
}): string {
  const { userName, inviterName, setupLink } = params

  const content = `
    <h2 style="color: ${BRAND_COLORS.dark}; margin-top: 0;">Welcome to My Virtual Mate!</h2>
    <p style="color: ${BRAND_COLORS.gray}; line-height: 1.6;">
      Hi ${userName},
    </p>
    <p style="color: ${BRAND_COLORS.gray}; line-height: 1.6;">
      ${inviterName} has invited you to join the My Virtual Mate admin panel. 
      Click the button below to set up your account and create your password.
    </p>
    <div style="text-align: center;">
      <a href="${setupLink}" class="button">Set Up My Account</a>
    </div>
    <p style="color: ${BRAND_COLORS.gray}; font-size: 14px; line-height: 1.6;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="color: ${BRAND_COLORS.blue}; font-size: 14px; word-break: break-all;">
      ${setupLink}
    </p>
    <p style="color: ${BRAND_COLORS.gray}; font-size: 14px; margin-top: 30px;">
      <strong>Note:</strong> This invitation link will expire in 24 hours for security reasons.
    </p>
  `

  return getEmailWrapper(content)
}

/**
 * Admin alert email template
 */
function getAlertEmailTemplate(params: {
  subject: string
  message: string
  actionType: string
  metadata?: Record<string, unknown>
}): string {
  const { subject, message, actionType, metadata } = params

  const metadataHtml = metadata
    ? `
    <div class="metadata">
      <strong>Details:</strong><br>
      ${Object.entries(metadata)
        .map(([key, value]) => `<strong>${key}:</strong> ${JSON.stringify(value)}`)
        .join('<br>')}
    </div>
  `
    : ''

  const content = `
    <h2 style="color: ${BRAND_COLORS.dark}; margin-top: 0;">${subject}</h2>
    <p style="color: ${BRAND_COLORS.gray}; line-height: 1.6;">
      ${message}
    </p>
    <div style="margin: 20px 0; padding: 15px; background-color: ${BRAND_COLORS.light}; border-radius: 6px;">
      <strong style="color: ${BRAND_COLORS.dark};">Action Type:</strong>
      <span style="color: ${BRAND_COLORS.blue}; font-weight: 600;">${actionType}</span>
    </div>
    ${metadataHtml}
    <p style="color: ${BRAND_COLORS.gray}; font-size: 14px; margin-top: 30px;">
      <strong>Time:</strong> ${new Date().toLocaleString()}
    </p>
    <div style="text-align: center; margin-top: 30px;">
      <a href="${SITE_URL}/admin/audit-logs" class="button">View Audit Logs</a>
    </div>
  `

  return getEmailWrapper(content)
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(testEmail: string): Promise<{
  success: boolean
  error?: string
}> {
  const html = getEmailWrapper(`
    <h2 style="color: ${BRAND_COLORS.dark}; margin-top: 0;">Email Configuration Test</h2>
    <p style="color: ${BRAND_COLORS.gray}; line-height: 1.6;">
      This is a test email to verify your email configuration is working correctly.
    </p>
    <p style="color: ${BRAND_COLORS.gray}; line-height: 1.6;">
      If you received this email, your Resend integration is set up properly!
    </p>
  `)

  return sendEmail({
    to: testEmail,
    subject: 'MVM Email Configuration Test',
    html,
  })
}
