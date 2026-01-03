import nodemailer from 'nodemailer';

// Zoho SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com',
  port: parseInt(process.env.ZOHO_SMTP_PORT || '465'),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.ZOHO_EMAIL,
    pass: process.env.ZOHO_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const fromEmail = process.env.ZOHO_EMAIL;
    const fromName = process.env.ZOHO_FROM_NAME || 'JulaZone';

    if (!fromEmail) {
      console.error('ZOHO_EMAIL environment variable is not set');
      return { success: false, error: 'Email configuration missing' };
    }

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
    });

    console.log(`Email sent successfully to ${options.to}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email templates
export function getSellerApprovalEmail(sellerName: string, businessName: string, boutiqueUrl: string): EmailOptions {
  const subject = `🎉 Congratulations! Your Boutique "${businessName}" is Now Live on JulaZone!`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Boutique Approved</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #4F46E5 0%, #14B8A6 100%); padding: 40px 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                    🎉 Welcome to JulaZone!
                  </h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: #18181b; margin: 0 0 20px 0; font-size: 24px;">
                    Hello ${sellerName}!
                  </h2>
                  
                  <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Great news! Your boutique <strong>"${businessName}"</strong> has been approved and is now <strong>live on JulaZone</strong>!
                  </p>
                  
                  <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    You now have full access to your seller dashboard where you can:
                  </p>
                  
                  <ul style="color: #52525b; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
                    <li>Add and manage your products</li>
                    <li>Track orders and manage inventory</li>
                    <li>View analytics and earnings</li>
                    <li>Customize your boutique appearance</li>
                    <li>Connect with customers</li>
                  </ul>
                  
                  <!-- CTA Button -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center" style="padding: 10px 0 30px 0;">
                        <a href="${boutiqueUrl}" 
                           style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #14B8A6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                          View Your Boutique →
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <p style="color: #52525b; font-size: 14px; line-height: 1.6; margin: 0;">
                      <strong>💡 Pro Tip:</strong> Start by adding at least 5 products with high-quality images to attract your first customers. The more products you have, the more visibility you'll get on our marketplace!
                    </p>
                  </div>
                  
                  <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0;">
                    If you have any questions or need assistance, our support team is here to help. Just reply to this email!
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f4f4f5; padding: 30px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
                  <p style="color: #71717a; font-size: 14px; margin: 0 0 10px 0;">
                    Thank you for choosing JulaZone!
                  </p>
                  <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} JulaZone. All rights reserved.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return {
    to: '', // Will be set when calling
    subject,
    html,
  };
}

export function getAccountApprovalEmail(sellerName: string, businessName: string, dashboardUrl: string): EmailOptions {
  const subject = `✅ Your Seller Account "${businessName}" Has Been Approved!`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Approved</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                    ✅ Account Approved!
                  </h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: #18181b; margin: 0 0 20px 0; font-size: 24px;">
                    Hello ${sellerName}!
                  </h2>
                  
                  <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Your seller account for <strong>"${businessName}"</strong> has been approved! 🎉
                  </p>
                  
                  <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    <strong>Next Step:</strong> Set up your boutique to start selling on JulaZone. You'll be able to:
                  </p>
                  
                  <ul style="color: #52525b; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
                    <li>Choose your boutique name and URL</li>
                    <li>Upload your logo and banner</li>
                    <li>Add a description and contact info</li>
                    <li>Customize your store appearance</li>
                  </ul>
                  
                  <!-- CTA Button -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center" style="padding: 10px 0 30px 0;">
                        <a href="${dashboardUrl}" 
                           style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                          Set Up Your Boutique →
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0;">
                    Once your boutique is set up, it will be reviewed by our team and you'll receive another email when it's live!
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f4f4f5; padding: 30px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
                  <p style="color: #71717a; font-size: 14px; margin: 0 0 10px 0;">
                    Thank you for joining JulaZone!
                  </p>
                  <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} JulaZone. All rights reserved.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return {
    to: '', // Will be set when calling
    subject,
    html,
  };
}
