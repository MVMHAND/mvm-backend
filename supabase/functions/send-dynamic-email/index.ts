/**
 * =============================================================================
 * SEND DYNAMIC EMAIL - Supabase Edge Function
 * =============================================================================
 *
 * A flexible, reusable email sending function for MVM (My Virtual Mate) that
 * supports dynamic form fields, customer email control, and customizable email
 * templates. Use this function to send professional, MVM-branded emails from
 * any form or page across the website.
 *
 * -----------------------------------------------------------------------------
 * ENDPOINT
 * -----------------------------------------------------------------------------
 * POST /functions/v1/send-dynamic-email
 *
 * -----------------------------------------------------------------------------
 * REQUEST BODY (JSON)
 * -----------------------------------------------------------------------------
 * {
 *   "subject": string,                 // REQUIRED - Email subject/inquiry title
 *   "name": string,                    // OPTIONAL - Sender's full name (falls back to "there" if not provided)
 *   "email": string,                   // REQUIRED - Sender's email address
 *   "fields": [                        // OPTIONAL - Array of dynamic form fields
 *     {
 *       "label": string,               // Field label (e.g., "Phone", "Company", "Message")
 *       "value": string                // Field value
 *     }
 *   ],
 *   "source": {                        // OPTIONAL - Source/origin information for tracking
 *     "formName": string,              // Form identifier (e.g., "Contact Form", "Career Application")
 *     "pageTitle": string,             // Page title where form was submitted
 *     "pageUrl": string                // Full URL of the page
 *   },
 *   "sendCustomerEmail": boolean,     // OPTIONAL - Whether to send confirmation email to customer (default: true)
 *   "customerEmail": {                 // OPTIONAL - Custom customer email configuration
 *     "subject": string,               // Custom subject line (default: "We've received your inquiry: {subject}")
 *     "body": string                   // Custom HTML body (overrides default template if provided)
 *   }
 * }
 *
 * -----------------------------------------------------------------------------
 * WHAT IT DOES
 * -----------------------------------------------------------------------------
 * 1. Sends a notification email to the MVM support team (sales.m@myvirtualmate.com)
 *    - Subject includes source details: "📬 {subject} | {formName} | {pageTitle} | {pageUrl}"
 *    - Professional HTML email with MVM branding (Blue: #025fc7, Yellow: #ba9309)
 *    - Displays contact info and all dynamic fields in a clean table format
 *
 * 2. Optionally sends a confirmation email to the customer (controlled by sendCustomerEmail)
 *    - Default Subject: "We've received your inquiry: {subject}"
 *    - Custom Subject: Use customerEmail.subject to override default
 *    - Custom Body: Use customerEmail.body to provide completely custom HTML
 *    - Default template: Thanks the user and shows their submission summary
 *    - Includes "What happens next" section and urgent contact info
 *
 * 💡 BACKWARD COMPATIBILITY:
 *    - If sendCustomerEmail is not provided, it defaults to TRUE (existing behavior)
 *    - If customerEmail customization is not provided, uses default template
 *    - Existing integrations will continue to work without any changes
 *
 * -----------------------------------------------------------------------------
 * EXAMPLE USAGE (Frontend)
 * -----------------------------------------------------------------------------
 *
 * // EXAMPLE 1: Basic usage (backward compatible - sends both emails)
 * ```typescript
 * const response = await fetch(`${SUPABASE_URL}/functions/v1/send-dynamic-email`, {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': `Bearer ${SUPABASE_ANON_KEY}` // Optional if verify_jwt=false
 *   },
 *   body: JSON.stringify({
 *     subject: "Partnership Inquiry",
 *     name: "John Doe",                    // Optional - can be omitted
 *     email: "john@example.com",
 *     source: {
 *       formName: "Contact Form",
 *       pageTitle: "Contact Us",
 *       pageUrl: window.location.href
 *     },
 *     fields: [
 *       { label: "Phone", value: "+1 234 567 8900" },
 *       { label: "Company", value: "Acme Corp" },
 *       { label: "Service", value: "Virtual Assistant" },
 *       { label: "Message", value: "I'd like to learn more about your services..." }
 *     ]
 *   })
 * });
 * ```
 *
 * // EXAMPLE 2: Disable customer confirmation email (admin notification only)
 * ```typescript
 * const response = await fetch(`${SUPABASE_URL}/functions/v1/send-dynamic-email`, {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
 *   },
 *   body: JSON.stringify({
 *     subject: "Internal Lead Capture",
 *     email: "customer@example.com",
 *     fields: [
 *       { label: "Lead Source", value: "Landing Page A" }
 *     ],
 *     sendCustomerEmail: false  // 🚫 No email sent to customer
 *   })
 * });
 * ```
 *
 * // EXAMPLE 3: Custom customer email subject (custom subject, default body)
 * ```typescript
 * const response = await fetch(`${SUPABASE_URL}/functions/v1/send-dynamic-email`, {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
 *   },
 *   body: JSON.stringify({
 *     subject: "Event Registration",
 *     name: "Jane Smith",
 *     email: "jane@example.com",
 *     fields: [
 *       { label: "Event", value: "Annual Conference 2026" },
 *       { label: "Ticket Type", value: "VIP" }
 *     ],
 *     customerEmail: {
 *       subject: "🎉 You're Registered! Event Confirmation"  // ✨ Custom subject
 *     }
 *   })
 * });
 * ```
 *
 * // EXAMPLE 4: Fully custom customer email (custom subject + custom HTML body)
 * ```typescript
 * const customHtmlBody = `
 *   <!DOCTYPE html>
 *   <html>
 *     <body style="font-family: Arial, sans-serif; padding: 20px;">
 *       <h1 style="color: #025fc7;">Thank You for Your Order!</h1>
 *       <p>Your order has been confirmed and will be processed shortly.</p>
 *       <div style="background: #f0f0f0; padding: 15px; border-radius: 8px;">
 *         <h3>Order Details:</h3>
 *         <p>Order ID: #12345</p>
 *         <p>Total: $99.99</p>
 *       </div>
 *       <p>Questions? Contact us at support@myvirtualmate.com</p>
 *     </body>
 *   </html>
 * `;
 *
 * const response = await fetch(`${SUPABASE_URL}/functions/v1/send-dynamic-email`, {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
 *   },
 *   body: JSON.stringify({
 *     subject: "Order Confirmation",
 *     email: "customer@example.com",
 *     fields: [
 *       { label: "Order ID", value: "#12345" },
 *       { label: "Total", value: "$99.99" }
 *     ],
 *     customerEmail: {
 *       subject: "Your MVM Order Confirmation #12345",  // ✨ Custom subject
 *       body: customHtmlBody  // ✨ Completely custom HTML template
 *     }
 *   })
 * });
 * ```
 *
 * const result = await response.json();
 * // { success: true, message: "...", requestId: "abc123" }
 * ```
 *
 * -----------------------------------------------------------------------------
 * RESPONSE FORMAT
 * -----------------------------------------------------------------------------
 * Success (200):
 * { "success": true, "message": "Thank you for reaching us...", "requestId": "abc123" }
 *
 * Validation Error (400):
 * { "success": false, "error": "Missing required fields..." }
 *
 * Server Error (500):
 * { "success": false, "error": "...", "requestId": "abc123" }
 *
 * -----------------------------------------------------------------------------
 * USE CASES
 * -----------------------------------------------------------------------------
 * ✅ Standard Contact Forms:
 *    - Use default settings (sendCustomerEmail: true, default template)
 *
 * ✅ Silent Lead Capture:
 *    - Set sendCustomerEmail: false to only notify admin
 *    - Useful for tracking/analytics without bothering customer
 *
 * ✅ Event Registrations:
 *    - Use custom subject: "You're registered for {event name}!"
 *    - Keep default template for consistency
 *
 * ✅ Order Confirmations:
 *    - Use fully custom HTML body with order details
 *    - Brand-specific templates
 *
 * ✅ Career Applications:
 *    - Custom subject: "Application Received for {position}"
 *    - Default template or custom acknowledgment
 *
 * ✅ Partnership Inquiries:
 *    - Custom subject with personalized message
 *    - Custom body for formal partnership acknowledgment
 *
 * ✅ Newsletter Signups:
 *    - Custom welcome email body
 *    - Branded HTML with company guidelines
 *
 * ✅ Quote Requests:
 *    - Custom subject: "Your quote request is being processed"
 *    - Custom body with estimated timeline
 *
 * ✅ Multi-tenant Applications:
 *    - Each tenant can provide their own email templates
 *    - Fully customizable per client/project
 *
 * -----------------------------------------------------------------------------
 * CONFIGURATION NOTES
 * -----------------------------------------------------------------------------
 * - Requires RESEND_API_KEY environment variable in Supabase
 * - JWT verification is disabled (verify_jwt=false in config.toml)
 * - All console logs include requestId for debugging/tracing
 * - MVM Brand Colors: Blue (#025fc7), Yellow (#ba9309)
 *
 * -----------------------------------------------------------------------------
 * BACKWARD COMPATIBILITY GUARANTEE
 * -----------------------------------------------------------------------------
 * ✅ Existing integrations will continue to work without any changes
 * ✅ Default behavior: Both admin and customer emails are sent
 * ✅ All new fields (sendCustomerEmail, customerEmail) are OPTIONAL
 * ✅ If new fields are omitted, function behaves exactly as before
 * ✅ Response includes customerEmailSent field for awareness (non-breaking)
 *
 * -----------------------------------------------------------------------------
 * RESPONSE FORMAT (Enhanced)
 * -----------------------------------------------------------------------------
 * Success (200):
 * {
 *   "success": true,
 *   "message": "Thank you for reaching us...",
 *   "requestId": "abc123",
 *   "customerEmailSent": true  // NEW: Indicates if customer email was sent
 * }
 *
 * Validation Error (400):
 * { "success": false, "error": "Missing required fields..." }
 *
 * Server Error (500):
 * { "success": false, "error": "...", "requestId": "abc123" }
 *
 * -----------------------------------------------------------------------------
 * BEST PRACTICES FOR MULTI-PROJECT USE
 * -----------------------------------------------------------------------------
 * 1. 📋 Default Forms (Contact, Career, Partnership):
 *    - Don't pass sendCustomerEmail or customerEmail
 *    - Uses default professional templates
 *
 * 2. 🎯 Lead Capture / Analytics:
 *    - Set sendCustomerEmail: false
 *    - Only admin team gets notified
 *
 * 3. 🎨 Branded Experiences:
 *    - Pass customerEmail.subject for custom subject lines
 *    - Keep default body for consistency
 *
 * 4. 🏢 Multi-tenant / White-label:
 *    - Pass complete custom HTML in customerEmail.body
 *    - Each tenant maintains their own templates
 *
 * 5. 🔍 Testing / Development:
 *    - Use sendCustomerEmail: false during testing
 *    - Prevents sending emails to real customers
 *
 * 6. 📊 A/B Testing:
 *    - Test different subject lines with customerEmail.subject
 *    - Test different templates with customerEmail.body
 *
 * =============================================================================
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { Resend } from 'npm:resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

// MVM Brand Colors
const MVM_BLUE = '#025fc7'
const MVM_YELLOW = '#ba9309'
const MVM_GRADIENT = `linear-gradient(135deg, ${MVM_BLUE} 0%, ${MVM_YELLOW} 100%)`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DynamicField {
  label: string
  value: string
}

interface SourceInfo {
  pageTitle?: string
  pageUrl?: string
  formName?: string
}

/**
 * Customer email customization options
 * Allows overriding default confirmation email behavior
 */
interface CustomerEmailConfig {
  subject?: string // Custom subject line (overrides default)
  body?: string // Custom HTML body (overrides entire default template)
}

/**
 * Main request interface for the dynamic email function
 * All fields maintain backward compatibility
 */
interface DynamicEmailRequest {
  subject: string // REQUIRED: Email subject for admin notification
  name?: string // OPTIONAL: Sender's name
  email: string // REQUIRED: Sender's email address
  fields?: DynamicField[] // OPTIONAL: Dynamic form fields
  source?: SourceInfo // OPTIONAL: Source tracking information
  sendCustomerEmail?: boolean // OPTIONAL: Whether to send customer email (default: true)
  customerEmail?: CustomerEmailConfig // OPTIONAL: Custom customer email configuration
}

/**
 * Formats a field label for display (converts camelCase/snake_case to Title Case)
 */
const formatLabel = (label: string): string => {
  return label
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

/**
 * Generates HTML for dynamic fields
 */
const generateDynamicFieldsHtml = (fields: DynamicField[]): string => {
  if (!fields || fields.length === 0) return ''

  return fields
    .map(
      (field) => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500; width: 35%; vertical-align: top;">
          ${formatLabel(field.label)}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #1f2937; word-break: break-word;">
          ${field.value || 'N/A'}
        </td>
      </tr>
    `
    )
    .join('')
}

/**
 * Generates the admin notification email HTML
 */
const generateAdminEmailHtml = (data: DynamicEmailRequest): string => {
  const dynamicFieldsHtml = generateDynamicFieldsHtml(data.fields || [])

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header with gradient -->
              <tr>
                <td style="background: ${MVM_GRADIENT}; padding: 32px 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                    📬 New Form Submission
                  </h1>
                  <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                    ${new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </td>
              </tr>

              <!-- Subject Section -->
              <tr>
                <td style="padding: 32px 40px 0 40px;">
                  <div style="background: linear-gradient(135deg, ${MVM_BLUE}10 0%, ${MVM_YELLOW}10 100%); border-left: 4px solid ${MVM_BLUE}; padding: 16px 20px; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: ${MVM_BLUE}; font-weight: 600;">Subject</p>
                    <p style="margin: 0; font-size: 18px; color: #1f2937; font-weight: 600;">${
                      data.subject
                    }</p>
                  </div>
                </td>
              </tr>

              <!-- Contact Info Section -->
              <tr>
                <td style="padding: 24px 40px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #374151; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    <span style="display: inline-block; width: 8px; height: 8px; background-color: ${MVM_BLUE}; border-radius: 50%; margin-right: 8px;"></span>
                    Contact Information
                  </h2>
                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                    ${
                      data.name
                        ? `<tr>
                      <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500; width: 35%;">Name</td>
                      <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${data.name}</td>
                    </tr>`
                        : ''
                    }
                    <tr>
                      <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Email</td>
                      <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                        <a href="mailto:${
                          data.email
                        }" style="color: ${MVM_BLUE}; text-decoration: none; font-weight: 500;">${
                          data.email
                        }</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Dynamic Fields Section -->
              ${
                data.fields && data.fields.length > 0
                  ? `
              <tr>
                <td style="padding: 0 40px 32px 40px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #374151; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    <span style="display: inline-block; width: 8px; height: 8px; background-color: ${MVM_YELLOW}; border-radius: 50%; margin-right: 8px;"></span>
                    Additional Details
                  </h2>
                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                    ${dynamicFieldsHtml}
                  </table>
                </td>
              </tr>
              `
                  : ''
              }

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
                  <table role="presentation" style="width: 100%;">
                    <tr>
                      <td style="text-align: center;">
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
                          This submission was received from
                        </p>
                        <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${MVM_BLUE};">
                          myvirtualmate.com.au
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

/**
 * Generates the customer confirmation email HTML
 */
const generateCustomerEmailHtml = (data: DynamicEmailRequest): string => {
  const dynamicFieldsHtml = generateDynamicFieldsHtml(data.fields || [])

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank you for contacting us</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header with gradient -->
              <tr>
                <td style="background: ${MVM_GRADIENT}; padding: 40px; text-align: center;">
                  <div style="display: inline-block; width: 64px; height: 64px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; line-height: 64px; margin-bottom: 16px;">
                    <span style="font-size: 32px;">✉️</span>
                  </div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                    Thank You${data.name ? `, ${data.name}` : ''}!
                  </h1>
                  <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                    We've received your message
                  </p>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                    Thank you for reaching out to <strong style="color: ${MVM_BLUE};">My Virtual Mate</strong>. We appreciate you taking the time to contact us and we're excited to assist you.
                  </p>

                  <!-- Submission Summary Card -->
                  <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                      Your Submission Summary
                    </h2>
                    
                    <div style="background: linear-gradient(135deg, ${MVM_BLUE}10 0%, ${MVM_YELLOW}10 100%); border-left: 4px solid ${MVM_BLUE}; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 16px;">
                      <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: ${MVM_BLUE}; font-weight: 600;">Subject</p>
                      <p style="margin: 0; font-size: 16px; color: #1f2937; font-weight: 500;">${
                        data.subject
                      }</p>
                    </div>

                    ${
                      data.fields && data.fields.length > 0
                        ? `
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                      ${dynamicFieldsHtml}
                    </table>
                    `
                        : ''
                    }
                  </div>

                  <!-- What's Next Section -->
                  <div style="background: linear-gradient(135deg, ${MVM_BLUE}08 0%, ${MVM_YELLOW}08 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1f2937; font-weight: 600;">
                      ⏱️ What happens next?
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.8;">
                      <li>Our team will review your enquiry carefully</li>
                      <li>We'll get back to you within <strong>24-48 hours</strong></li>
                      <li>Check your inbox (and spam folder) for our response</li>
                    </ul>
                  </div>

                  <!-- Urgent Contact CTA -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="background: ${MVM_GRADIENT}; border-radius: 12px; padding: 24px; text-align: center;">
                        <p style="margin: 0 0 8px 0; color: #ffffff; font-size: 16px; font-weight: 600;">
                          Need urgent assistance?
                        </p>
                        <a href="mailto:sales.m@myvirtualmate.com" style="display: inline-block; background-color: #ffffff; color: ${MVM_BLUE}; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 8px;">
                          📧 sales.m@myvirtualmate.com
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #1f2937; padding: 32px 40px; text-align: center;">
                  <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #ffffff;">
                    My Virtual Mate
                  </p>
                  <p style="margin: 0 0 16px 0; font-size: 14px; color: #9ca3af;">
                    Your Trusted Virtual Partner
                  </p>
                  <div style="border-top: 1px solid #374151; padding-top: 16px; margin-top: 8px;">
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">
                      🔒 Your information is secure and encrypted.<br>
                      We'll never share your details with third parties.
                    </p>
                  </div>
                </td>
              </tr>

            </table>

            <!-- Unsubscribe/Legal Footer -->
            <table role="presentation" style="max-width: 600px; margin: 16px auto 0 auto;">
              <tr>
                <td style="text-align: center; padding: 0 20px;">
                  <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                    © ${new Date().getFullYear()} My Virtual Mate. All rights reserved.<br>
                    This is an automated confirmation email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log('[send-dynamic-email] CORS preflight request received')
    return new Response(null, { headers: corsHeaders })
  }

  const requestId = crypto.randomUUID().slice(0, 8)
  console.log(`[send-dynamic-email][${requestId}] ======= New Request =======`)
  console.log(`[send-dynamic-email][${requestId}] Method: ${req.method}`)
  console.log(`[send-dynamic-email][${requestId}] Timestamp: ${new Date().toISOString()}`)

  try {
    // Parse request body
    const emailData: DynamicEmailRequest = await req.json()

    // Log received data
    console.log(
      `[send-dynamic-email][${requestId}] Received email data:`,
      JSON.stringify(
        {
          subject: emailData.subject,
          name: emailData.name || '(not provided)',
          email: emailData.email,
          fieldsCount: emailData.fields?.length || 0,
          source: emailData.source || null,
        },
        null,
        2
      )
    )

    // Log source info if present
    if (emailData.source) {
      console.log(`[send-dynamic-email][${requestId}] Source information:`)
      if (emailData.source.formName) {
        console.log(`[send-dynamic-email][${requestId}]   Form Name: ${emailData.source.formName}`)
      }
      if (emailData.source.pageTitle) {
        console.log(
          `[send-dynamic-email][${requestId}]   Page Title: ${emailData.source.pageTitle}`
        )
      }
      if (emailData.source.pageUrl) {
        console.log(`[send-dynamic-email][${requestId}]   Page URL: ${emailData.source.pageUrl}`)
      }
    }

    // Validate required fields
    if (!emailData.subject || !emailData.email) {
      console.error(
        `[send-dynamic-email][${requestId}] Validation failed - missing required fields (subject: ${!!emailData.subject}, email: ${!!emailData.email})`
      )
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields. Please provide subject and email.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailData.email)) {
      console.error(
        `[send-dynamic-email][${requestId}] Validation failed - invalid email format: ${emailData.email}`
      )
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid email format.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    // Log dynamic fields if present
    if (emailData.fields && emailData.fields.length > 0) {
      console.log(`[send-dynamic-email][${requestId}] Dynamic fields received:`)
      emailData.fields.forEach((field, index) => {
        console.log(
          `[send-dynamic-email][${requestId}]   ${index + 1}. ${
            field.label
          }: ${field.value?.substring(0, 100)}${field.value?.length > 100 ? '...' : ''}`
        )
      })
    }

    // Generate email HTML
    const adminEmailHtml = generateAdminEmailHtml(emailData)
    const customerEmailHtml = generateCustomerEmailHtml(emailData)

    console.log(`[send-dynamic-email][${requestId}] Sending admin notification email...`)

    // Build admin email subject with source details
    const adminSubjectParts = [`📬 ${emailData.subject}`]
    if (emailData.source?.formName) {
      adminSubjectParts.push(`| ${emailData.source.formName}`)
    }
    if (emailData.source?.pageTitle) {
      adminSubjectParts.push(`| ${emailData.source.pageTitle}`)
    }
    if (emailData.source?.pageUrl) {
      adminSubjectParts.push(`| ${emailData.source.pageUrl}`)
    }
    const adminSubject = adminSubjectParts.join(' ')

    console.log(`[send-dynamic-email][${requestId}] Admin email subject: ${adminSubject}`)

    // Send email to support team
    const supportEmailResponse = await resend.emails.send({
      from: 'Contact Form <sales.m@myvirtualmate.com>',
      to: ['sales.m@myvirtualmate.com'],
      subject: adminSubject,
      html: adminEmailHtml,
    })

    console.log(
      `[send-dynamic-email][${requestId}] Admin email sent successfully:`,
      JSON.stringify(supportEmailResponse, null, 2)
    )

    // ========================================================================
    // CUSTOMER EMAIL LOGIC (with control and customization)
    // ========================================================================
    // Default behavior: sendCustomerEmail = true (backward compatible)
    // Can be disabled by setting sendCustomerEmail: false
    // Can be customized with customerEmail.subject and/or customerEmail.body
    // ========================================================================

    const shouldSendCustomerEmail = emailData.sendCustomerEmail !== false // Default to true

    if (shouldSendCustomerEmail) {
      console.log(`[send-dynamic-email][${requestId}] Preparing customer confirmation email...`)

      // Determine customer email subject (custom or default)
      const customerSubject = emailData.customerEmail?.subject
        ? emailData.customerEmail.subject
        : `We've received your inquiry: ${emailData.subject}`

      // Determine customer email body (custom or default template)
      const customerBody = emailData.customerEmail?.body
        ? emailData.customerEmail.body
        : customerEmailHtml

      // Log customization status
      if (emailData.customerEmail?.subject) {
        console.log(`[send-dynamic-email][${requestId}] Using CUSTOM subject: "${customerSubject}"`)
      } else {
        console.log(
          `[send-dynamic-email][${requestId}] Using DEFAULT subject: "${customerSubject}"`
        )
      }

      if (emailData.customerEmail?.body) {
        console.log(
          `[send-dynamic-email][${requestId}] Using CUSTOM HTML body (${emailData.customerEmail.body.length} characters)`
        )
      } else {
        console.log(`[send-dynamic-email][${requestId}] Using DEFAULT template body`)
      }

      console.log(
        `[send-dynamic-email][${requestId}] Sending customer confirmation email to: ${emailData.email}`
      )

      // Send confirmation email to customer
      const customerEmailResponse = await resend.emails.send({
        from: 'My Virtual Mate <sales.m@myvirtualmate.com>',
        to: [emailData.email],
        subject: customerSubject,
        html: customerBody,
      })

      console.log(
        `[send-dynamic-email][${requestId}] Customer confirmation email sent successfully:`,
        JSON.stringify(customerEmailResponse, null, 2)
      )
    } else {
      console.log(
        `[send-dynamic-email][${requestId}] ⚠️  Customer email DISABLED (sendCustomerEmail: false). Skipping customer confirmation email.`
      )
    }

    console.log(`[send-dynamic-email][${requestId}] ======= Request Complete =======`)

    // Prepare success response with appropriate message
    const successMessage = shouldSendCustomerEmail
      ? "Thank you for reaching us. We'll get back to you soon."
      : 'Your submission has been received and our team has been notified.'

    return new Response(
      JSON.stringify({
        success: true,
        message: successMessage,
        requestId: requestId,
        customerEmailSent: shouldSendCustomerEmail, // Inform caller if customer email was sent
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error(`[send-dynamic-email][${requestId}] ======= ERROR =======`)
    console.error(`[send-dynamic-email][${requestId}] Error message:`, errorMessage)
    if (errorStack) {
      console.error(`[send-dynamic-email][${requestId}] Stack trace:`, errorStack)
    }
    console.error(
      `[send-dynamic-email][${requestId}] Full error object:`,
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    )

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage || 'Something went wrong. Please try again after sometime.',
        requestId: requestId,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }
}

serve(handler)
