import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SOSRequest {
  sos_event_id: string;
  emergency_type: string;
  description?: string;
}

const generateEmailTemplate = (
  touristName: string,
  digitalId: string,
  latitude: number,
  longitude: number,
  emergencyType: string,
  description: string,
  timestamp: string,
  deviceInfo: Record<string, unknown>
) => {
  const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
  const deviceString = deviceInfo?.userAgent || "Unknown";

  const htmlEmail = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .details { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
            .detail-row { margin: 10px 0; display: flex; justify-content: space-between; }
            .label { font-weight: bold; color: #495057; }
            .value { color: #212529; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>🚨 EMERGENCY ALERT - Tour Guard SOS</h2>
            </div>
            <div class="content">
                <div class="alert-box">
                    <strong>⚠️ An emergency alert has been triggered</strong>
                </div>

                <h3>Tourist Information</h3>
                <div class="details">
                    <div class="detail-row">
                        <span class="label">Name:</span>
                        <span class="value">${touristName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Digital ID:</span>
                        <span class="value">${digitalId}</span>
                    </div>
                </div>

                <h3>Emergency Details</h3>
                <div class="details">
                    <div class="detail-row">
                        <span class="label">Emergency Type:</span>
                        <span class="value">${emergencyType.toUpperCase()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Description:</span>
                        <span class="value">${description || "No description provided"}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Triggered At:</span>
                        <span class="value">${timestamp}</span>
                    </div>
                </div>

                <h3>Location Information</h3>
                <div class="details">
                    <div class="detail-row">
                        <span class="label">Coordinates:</span>
                        <span class="value">${latitude.toFixed(6)}, ${longitude.toFixed(6)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Open in Maps:</span>
                        <span class="value"><a href="${mapsUrl}" style="color: #667eea; text-decoration: none;">Click Here</a></span>
                    </div>
                </div>

                <h3>Device Information</h3>
                <div class="details">
                    <div class="detail-row">
                        <span class="label">Device:</span>
                        <span class="value">${deviceString.substring(0, 100)}</span>
                    </div>
                </div>

                <a href="${mapsUrl}" class="button">View Location on Google Maps</a>

                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    <strong>Note:</strong> This is an automated emergency alert from Tour Guard.
                    Please respond immediately and contact local authorities if needed.
                </p>
            </div>
            <div class="footer">
                <p>Tour Guard - Tourist Emergency Response System</p>
                <p>This is a confidential emergency notification. Do not forward without permission.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const plainTextEmail = `
EMERGENCY ALERT - Tour Guard SOS
${"=".repeat(50)}

A tourist has triggered an emergency alert. Please respond immediately.

TOURIST INFORMATION
Name: ${touristName}
Digital ID: ${digitalId}

EMERGENCY DETAILS
Emergency Type: ${emergencyType.toUpperCase()}
Description: ${description || "No description provided"}
Triggered At: ${timestamp}

LOCATION INFORMATION
Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
Maps Link: ${mapsUrl}

DEVICE INFORMATION
Device: ${deviceString.substring(0, 100)}

${"=".repeat(50)}
This is an automated emergency alert from Tour Guard.
Please respond immediately and contact local authorities if needed.

Tour Guard - Tourist Emergency Response System
This is a confidential emergency notification. Do not forward without permission.
  `;

  return { htmlEmail, plainTextEmail };
};

const sendEmail = async (
  recipientEmail: string,
  recipientName: string,
  htmlContent: string,
  plainTextContent: string,
  subject: string
) => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY environment variable is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "onboarding@resend.dev",
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
      text: plainTextContent,
      reply_to: "noreply@tourguard.app",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return {
    success: true,
    messageId: data.id,
  };
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { sos_event_id }: SOSRequest = await req.json();

    if (!sos_event_id) {
      return new Response(
        JSON.stringify({ error: "Missing sos_event_id" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch SOS event details
    const { data: sosEvent, error: sosError } = await supabase
      .from("sos_events")
      .select("*")
      .eq("id", sos_event_id)
      .maybeSingle();

    if (sosError || !sosEvent) {
      throw new Error(`Failed to fetch SOS event: ${sosError?.message}`);
    }

    // Fetch user details
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", sosEvent.user_id)
      .maybeSingle();

    if (userError || !user) {
      throw new Error(`Failed to fetch user: ${userError?.message}`);
    }

    // Fetch emergency contacts
    const { data: emergencyContacts, error: contactsError } = await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("user_id", sosEvent.user_id);

    if (contactsError) {
      throw new Error(`Failed to fetch emergency contacts: ${contactsError.message}`);
    }

    // Generate email template
    const { htmlEmail, plainTextEmail } = generateEmailTemplate(
      user.name,
      user.digital_id,
      sosEvent.latitude || 0,
      sosEvent.longitude || 0,
      sosEvent.emergency_type,
      sosEvent.description || "",
      new Date(sosEvent.triggered_at).toLocaleString(),
      sosEvent.device_info || {}
    );

    // Send emails to emergency contacts
    const emailPromises = (emergencyContacts || []).map(async (contact) => {
      try {
        const emailResult = await sendEmail(
          contact.contact_email,
          contact.contact_name,
          htmlEmail,
          plainTextEmail,
          `URGENT: Emergency Alert for ${user.name} - Digital ID: ${user.digital_id}`
        );

        // Log email send
        await supabase
          .from("email_logs")
          .insert({
            sos_event_id,
            recipient_email: contact.contact_email,
            recipient_name: contact.contact_name,
            status: emailResult.success ? "sent" : "failed",
            sent_at: new Date().toISOString(),
          });

        return { success: true, email: contact.contact_email };
      } catch (error) {
        console.error(`Failed to send email to ${contact.contact_email}:`, error);

        // Log failed email
        await supabase
          .from("email_logs")
          .insert({
            sos_event_id,
            recipient_email: contact.contact_email,
            recipient_name: contact.contact_name,
            status: "failed",
            error_message: String(error),
          });

        return { success: false, email: contact.contact_email, error: String(error) };
      }
    });

    const results = await Promise.all(emailPromises);

    return new Response(
      JSON.stringify({
        success: true,
        message: "SOS emails triggered",
        sos_event_id,
        emails_sent: results.filter((r) => r.success).length,
        emails_failed: results.filter((r) => !r.success).length,
        results,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("SOS Email Error:", error);

    return new Response(
      JSON.stringify({
        error: String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
