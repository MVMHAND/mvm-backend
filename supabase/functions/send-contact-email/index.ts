import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { Resend } from 'npm:resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContactRequest {
  name: string
  email: string
  phone?: string
  service: string
  industry: string
  subject: string
  message: string
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const contactData: ContactRequest = await req.json()
    console.log('Received contact form submission:', contactData)

    // Send email to support team
    const supportEmailResponse = await resend.emails.send({
      from: 'Contact Form <expressmate@myvirtualmate.com>',
      to: ['expressmate@myvirtualmate.com'],
      subject: `New Contact Form Submission: ${contactData.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">New Contact Form Submission</h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #4CAF50; margin-top: 0;">Contact Information</h3>
            <p><strong>Name:</strong> ${contactData.name}</p>
            <p><strong>Email:</strong> ${contactData.email}</p>
            ${contactData.phone ? `<p><strong>Phone:</strong> ${contactData.phone}</p>` : ''}
            <p><strong>Service:</strong> ${contactData.service}</p>
            <p><strong>Industry:</strong> ${contactData.industry}</p>
          </div>

          <div style="background-color: #fff; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Subject</h3>
            <p>${contactData.subject}</p>
          </div>

          <div style="background-color: #fff; padding: 20px; border-left: 4px solid #2196F3; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Message</h3>
            <p style="white-space: pre-wrap;">${contactData.message}</p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>This email was sent from the contact form at myvirtualmate.com.au</p>
          </div>
        </div>
      `,
    })

    console.log('Support email sent successfully:', supportEmailResponse)

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: 'My Virtual Mate <expressmate@myvirtualmate.com>',
      to: [contactData.email],
      subject: 'Thank you for contacting My Virtual Mate',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Thank you for reaching out, ${contactData.name}!</h2>
          
          <p style="color: #333; line-height: 1.6;">
            We have received your message and appreciate you taking the time to contact us.
          </p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Your Submission Details</h3>
            <p><strong>Subject:</strong> ${contactData.subject}</p>
            <p><strong>Service:</strong> ${contactData.service}</p>
            <p><strong>Industry:</strong> ${contactData.industry}</p>
          </div>

          <p style="color: #333; line-height: 1.6;">
            Our team will review your inquiry and get back to you as soon as possible, typically within 24-48 hours.
          </p>

          <div style="margin-top: 30px; padding: 20px; background-color: #4CAF50; border-radius: 5px; text-align: center;">
            <p style="color: white; margin: 0; font-weight: bold;">Need urgent assistance?</p>
            <p style="color: white; margin: 10px 0 0 0;">Email us at: <a href="mailto:expressmate@myvirtualmate.com" style="color: white;">expressmate@myvirtualmate.com</a></p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p style="margin: 5px 0;"><strong>My Virtual Mate</strong></p>
            <p style="margin: 5px 0;">Your information is secure and encrypted. We'll never share your details with third parties.</p>
          </div>
        </div>
      `,
    })

    console.log('Customer confirmation email sent successfully:', customerEmailResponse)

    return new Response(
      JSON.stringify({
        success: true,
        message: "Thank you for reaching us. We'll get back to you soon.",
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  } catch (error: any) {
    console.error('Error in send-contact-email function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Something went wrong. Please try again after sometime.',
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
