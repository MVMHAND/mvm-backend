import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { Resend } from 'npm:resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewsletterRequest {
  email: string
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email }: NewsletterRequest = await req.json()
    console.log('Received newsletter subscription:', email)

    // Send notification email to support team
    const notificationResponse = await resend.emails.send({
      from: 'Newsletter <expressmate@myvirtualmate.com>',
      to: ['expressmate@myvirtualmate.com'],
      subject: 'New Blog Newsletter Subscription',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #025fc7; padding-bottom: 10px;">New Newsletter Subscription</h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #025fc7; margin-top: 0;">Subscriber Information</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subscription Date:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>This email was sent from the blog newsletter subscription form at myvirtualmate.com.au</p>
          </div>
        </div>
      `,
    })

    console.log('Notification email sent successfully:', notificationResponse)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully subscribed to the newsletter!',
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
    console.error('Error in send-newsletter-subscription function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to subscribe. Please try again.',
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
