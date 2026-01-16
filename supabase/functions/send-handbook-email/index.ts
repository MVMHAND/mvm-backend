import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { Resend } from 'npm:resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HandbookEmailRequest {
  email: string
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email }: HandbookEmailRequest = await req.json()

    console.log('Processing email request for:', email)

    if (!email) {
      console.log('No email provided')
      return new Response(JSON.stringify({ error: 'Email address is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    console.log('Sending email via Resend...')

    const emailResponse = await resend.emails.send({
      from: 'My Virtual Mate <clientsolutions@myvirtualmate.com.au>',
      to: [email],
      subject: 'Your Outsourcing Success Guide is Here! 📚',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎉 Your Free Guide is Ready!</h1>
            <p style="color: #e2e8f0; margin: 10px 0 0; font-size: 16px;">Beyond Borders: A Practical Guide to Outsourcing Success</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-bottom: 20px;">
            <h2 style="color: #1e293b; margin-top: 0; font-size: 22px;">Dear Future Outsourcing Success Story,</h2>
            
            <p style="color: #475569; line-height: 1.6; font-size: 16px;">
              Thank you for downloading our comprehensive outsourcing handbook! We're excited to help you navigate the world of remote talent and build a successful virtual team.
            </p>
            
            <div style="background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px;">
              <h3 style="color: #1e293b; margin-top: 0; font-size: 18px;">🚀 Access Your Guide Now</h3>
              <p style="color: #475569; margin-bottom: 15px;">Click the button below to access your complete outsourcing handbook:</p>
              <a href="https://mvm-outsourcing-insights.myvirtualmate.com.au/handbook/outsourcing" 
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                📖 Access Your Handbook
              </a>
            </div>
            
            <div style="margin: 25px 0;">
              <h3 style="color: #1e293b; font-size: 18px;">What you'll discover inside:</h3>
              <ul style="color: #475569; line-height: 1.6;">
                <li>✅ Step-by-step guide to successful outsourcing</li>
                <li>✅ How to find and hire the right virtual staff</li>
                <li>✅ Best practices for managing remote teams</li>
                <li>✅ Cost-saving strategies and ROI optimization</li>
                <li>✅ Common pitfalls and how to avoid them</li>
                <li>✅ Real-world case studies and success stories</li>
              </ul>
            </div>
            
            <div style="background: #ecfdf5; border: 1px solid #d1fae5; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #065f46; margin-top: 0; font-size: 18px;">💡 Pro Tip</h3>
              <p style="color: #059669; margin-bottom: 0;">Bookmark this link for easy access, and don't forget to share it with your team members who might benefit from these insights!</p>
            </div>
            
            <p style="color: #475569; line-height: 1.6;">
              At My Virtual Mate, we're committed to helping businesses like yours achieve success through strategic outsourcing. If you have any questions or need personalized guidance, our team is here to help.
            </p>
            
            <p style="color: #475569; line-height: 1.6;">
              Ready to take the next step? Contact us for a free consultation and discover how we can help you build your dream virtual team.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px;">
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              Best regards,<br>
              <strong>The My Virtual Mate Team</strong><br>
              clientsolutions@myvirtualmate.com.au
            </p>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                🔒 We respect your privacy. You're receiving this email because you requested our outsourcing handbook.
              </p>
            </div>
          </div>
        </div>
      `,
    })

    console.log('Resend response:', emailResponse)

    if (emailResponse.error) {
      console.error('Resend error details:', emailResponse.error)
      return new Response(
        JSON.stringify({
          error: 'Failed to send email',
          details: emailResponse.error.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    console.log('Email sent successfully with ID:', emailResponse.data?.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Handbook link sent successfully!',
        id: emailResponse.data?.id,
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
    console.error('Error in send-handbook-email function:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to send email',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
}

serve(handler)
