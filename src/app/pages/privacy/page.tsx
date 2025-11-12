import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  const lastUpdated = 'January 12, 2025';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="outline" asChild>
            <Link href="/">← Back to Shop</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
          </CardHeader>

          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
              <p>
                Welcome to Lumo ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
              </p>
              <p>
                By using our services, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>

              <h3 className="text-xl font-semibold mb-2">Personal Information</h3>
              <p>We collect the following personal information when you create an account:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Name:</strong> Your full name for account identification</li>
                <li><strong>Email Address:</strong> For account login, order confirmations, and communications</li>
                <li><strong>Phone Number:</strong> For account verification and order updates (SMS)</li>
                <li><strong>Password:</strong> Securely hashed and stored for account access</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2">Order Information</h3>
              <p>When you place an order, we collect:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Shipping address</li>
                <li>Billing information</li>
                <li>Payment method details (processed securely by our payment provider)</li>
                <li>Order history and preferences</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2">Automatically Collected Information</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>IP address and location data</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Pages visited and time spent on site</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
              <p>We use your information for the following purposes:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Account Management:</strong> To create and maintain your account</li>
                <li><strong>Order Processing:</strong> To process and fulfill your orders</li>
                <li><strong>Communication:</strong> To send order confirmations, shipping updates, and customer service messages</li>
                <li><strong>Verification:</strong> To verify your email and phone number for security</li>
                <li><strong>Security:</strong> To prevent fraud and protect against unauthorized access</li>
                <li><strong>Improvement:</strong> To analyze usage and improve our services</li>
                <li><strong>Marketing:</strong> To send promotional offers (with your consent)</li>
                <li><strong>Compliance:</strong> To comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Email and Phone Verification</h2>
              <p>
                We require both email and phone verification to ensure account security and prevent fraudulent activity. Your email and phone number are verified through:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Email:</strong> Verification link sent to your email address</li>
                <li><strong>Phone (SMS):</strong> 6-digit one-time password (OTP) sent via SMS</li>
              </ul>
              <p>
                These verification codes expire after 5 minutes for security reasons. Your phone number is stored in normalized E.164 international format.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Passwords are hashed using bcrypt encryption</li>
                <li>SSL/TLS encryption for data transmission</li>
                <li>Rate limiting to prevent brute-force attacks</li>
                <li>Secure authentication via Supabase Auth</li>
                <li>Regular security audits and updates</li>
                <li>Email validation to block disposable addresses</li>
                <li>Phone number uniqueness enforcement</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Uniqueness Requirements</h2>
              <p>
                To prevent abuse and ensure account security:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Each email address can only be used for one account</li>
                <li>Each phone number can only be used for one account</li>
                <li>We check for duplicate accounts during signup</li>
                <li>Attempts to create duplicate accounts will be blocked with a clear error message</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Sharing Your Information</h2>
              <p>We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Service Providers:</strong> Payment processors, shipping carriers, SMS providers</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Your Rights (GDPR Compliance)</h2>
              <p>If you are in the European Economic Area (EEA), you have the following rights:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                <li><strong>Right to Restriction:</strong> Request restriction of processing</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Right to Object:</strong> Object to processing of your data</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
              </ul>
              <p>
                To exercise these rights, please contact us at <a href="mailto:privacy@lumo.shop" className="text-primary underline">privacy@lumo.shop</a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
              <p>We retain your information:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Account Data:</strong> As long as your account is active</li>
                <li><strong>Order Data:</strong> For 7 years for tax and legal compliance</li>
                <li><strong>OTP Codes:</strong> Automatically deleted after 24 hours</li>
                <li><strong>Rate Limit Data:</strong> Automatically deleted after 7 days</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Maintain your logged-in session</li>
                <li>Remember your preferences</li>
                <li>Analyze site traffic and usage</li>
                <li>Improve user experience</li>
              </ul>
              <p>You can control cookies through your browser settings.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
              <p>We use the following third-party services:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Supabase:</strong> Authentication and database hosting</li>
                <li><strong>Vercel:</strong> Website hosting and deployment</li>
                <li><strong>SMS Provider:</strong> Twilio/MessageBird for phone verification</li>
                <li><strong>Payment Processor:</strong> For secure payment processing</li>
              </ul>
              <p>These services have their own privacy policies and we recommend reviewing them.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
              <p>
                Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us:</p>
              <ul className="list-none mb-4">
                <li><strong>Email:</strong> <a href="mailto:privacy@lumo.shop" className="text-primary underline">privacy@lumo.shop</a></li>
                <li><strong>Support Email:</strong> <a href="mailto:support@lumo.shop" className="text-primary underline">support@lumo.shop</a></li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
