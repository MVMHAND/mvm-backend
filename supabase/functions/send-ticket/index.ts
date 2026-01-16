import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TicketRequest {
  fullName: string;
  email: string;
  department: string;
  priority: string;
  subject: string;
  description: string;
  recipientEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send ticket function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      fullName,
      email,
      department,
      priority,
      subject,
      description,
      recipientEmail,
    }: TicketRequest = await req.json();

    console.log("Ticket data received:", {
      fullName,
      email,
      department,
      priority,
      subject,
      recipientEmail,
    });

    // Generate ticket number
    const ticketNumber = `TICKET-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Send email to recipient (support team)
    const emailResponse = await resend.emails.send({
      from: "Support Tickets <expressmate@myvirtualmate.com>",
      to: [recipientEmail],
      subject: `New Support Ticket: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            New Support Ticket Submitted
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Ticket Number:</strong> ${ticketNumber}</p>
            <p style="margin: 5px 0;"><strong>Priority:</strong> <span style="color: ${
              priority === "Urgent" ? "#dc3545" : priority === "High" ? "#fd7e14" : "#28a745"
            };">${priority}</span></p>
            <p style="margin: 5px 0;"><strong>Department:</strong> ${department}</p>
          </div>

          <h3 style="color: #333;">Customer Information</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${fullName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>

          <h3 style="color: #333; margin-top: 20px;">Ticket Details</h3>
          <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
          
          <div style="background-color: #ffffff; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; margin-top: 10px;">
            <p style="margin: 0; white-space: pre-wrap;">${description}</p>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          
          <p style="color: #6c757d; font-size: 12px; text-align: center;">
            This ticket was submitted on ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    });

    console.log("Ticket email sent successfully:", emailResponse);

    // Send confirmation email to customer
    const confirmationResponse = await resend.emails.send({
      from: "Support <noreply@myvirtualmate.com>",
      to: [email],
      subject: `Your Support Ticket Has Been Received - ${ticketNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Thank you for contacting us, ${fullName}!</h2>
          
          <p>We have received your support ticket and our team will review it shortly.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Ticket Number:</strong> ${ticketNumber}</p>
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="margin: 5px 0;"><strong>Priority:</strong> ${priority}</p>
          </div>

          <p>We aim to respond within <strong>5 business days</strong>. If your issue is urgent, please make sure you've selected the appropriate priority level.</p>
          
          <p>For reference, here's what you submitted:</p>
          <div style="background-color: #ffffff; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; margin-top: 10px;">
            <p style="margin: 0; white-space: pre-wrap;">${description}</p>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          
          <p style="color: #6c757d; font-size: 12px;">
            Best regards,<br>
            The Support Team
          </p>
        </div>
      `,
    });

    console.log("Confirmation email sent successfully:", confirmationResponse);

    return new Response(
      JSON.stringify({
        success: true,
        ticketNumber,
        message: "Ticket submitted successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-ticket function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
