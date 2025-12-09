import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfServicePage() {
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
            <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
          </CardHeader>

          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Agreement to Terms</h2>
              <p>
                By accessing or using Lumo ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Account Registration</h2>

              <h3 className="text-xl font-semibold mb-2">Eligibility</h3>
              <p>You must be at least 13 years old to use this Service. By creating an account, you represent that you meet this age requirement.</p>

              <h3 className="text-xl font-semibold mb-2">Account Requirements</h3>
              <p>To create an account, you must provide:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>A valid email address</li>
                <li>A verified phone number</li>
                <li>Accurate personal information</li>
                <li>A secure password meeting our requirements (min 8 characters, uppercase, lowercase, number)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2">One Account Per Email/Phone</h3>
              <p>
                Each email address and phone number may only be used for one account. Attempts to create multiple accounts with the same email or phone number will be rejected. This policy helps prevent fraud and abuse.
              </p>

              <h3 className="text-xl font-semibold mb-2">Verification Requirements</h3>
              <p>Your account must be verified before activation:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Email Verification:</strong> You must verify your email by clicking the link sent to your email address</li>
                <li><strong>Phone Verification:</strong> You must verify your phone number by entering the 6-digit SMS code sent to you</li>
                <li><strong>Full Activation:</strong> Your account is only fully active after both verifications are complete</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2">Account Security</h3>
              <p>You are responsible for:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Maintaining the confidentiality of your password</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Using a strong, unique password</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Use disposable or temporary email addresses</li>
                <li>Provide false or misleading information</li>
                <li>Create multiple accounts</li>
                <li>Share your account credentials</li>
                <li>Attempt to bypass our security measures</li>
                <li>Use automated tools or bots for account creation</li>
                <li>Engage in fraudulent activities</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Harass or harm other users</li>
                <li>Transmit spam, viruses, or malicious code</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Rate Limiting and Abuse Prevention</h2>
              <p>
                To protect our Service and prevent abuse, we implement rate limiting:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Signup Attempts:</strong> Limited to 5 attempts per 15 minutes per IP address</li>
                <li><strong>OTP Requests:</strong> Limited to 3 requests per hour per phone number</li>
                <li><strong>Verification Attempts:</strong> Limited to 5 attempts per 15 minutes</li>
                <li><strong>Login Attempts:</strong> Limited to 5 attempts per 15 minutes</li>
              </ul>
              <p>
                Exceeding these limits will result in temporary blocks with clear error messages indicating when you can try again.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Orders and Payments</h2>

              <h3 className="text-xl font-semibold mb-2">Product Availability</h3>
              <p>
                All products are subject to availability. We reserve the right to limit quantities, discontinue products, or refuse service to anyone at any time.
              </p>

              <h3 className="text-xl font-semibold mb-2">Pricing</h3>
              <p>
                Prices are subject to change without notice. The price charged will be the price displayed at the time of purchase. All prices are in Gambian Dalasi (GMD) unless otherwise stated.
              </p>

              <h3 className="text-xl font-semibold mb-2">Payment</h3>
              <p>We accept:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Wave Money</li>
                <li>Cash on Delivery</li>
                <li>Credit/Debit Cards (where available)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2">Order Confirmation</h3>
              <p>
                You will receive an email confirmation after placing an order. This confirmation does not constitute acceptance of your order. We reserve the right to cancel orders for any reason.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Shipping and Delivery</h2>
              <p>
                Shipping times and costs vary based on location. We are not responsible for delays caused by shipping carriers, customs, or other third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Returns and Refunds</h2>
              <p>
                Our return and refund policy is available separately. Please review it for information on returns, exchanges, and refunds.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
              <p>
                All content on this Service, including text, images, logos, and software, is the property of Lumo or its licensors and is protected by copyright and other intellectual property laws.
              </p>
              <p>You may not:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Copy, modify, or distribute our content without permission</li>
                <li>Use our trademarks or branding without authorization</li>
                <li>Reverse engineer or decompile any part of the Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Privacy and Data Protection</h2>
              <p>
                Your use of the Service is also governed by our <Link href="/pages/privacy" className="text-primary underline">Privacy Policy</Link>. By using the Service, you consent to our collection and use of your information as described in the Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Disclaimer of Warranties</h2>
              <p>
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, LUMO SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Lumo, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account at any time for any reason, including violation of these Terms. Upon termination:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Your access to the Service will be revoked immediately</li>
                <li>You will no longer be able to access your account</li>
                <li>We may delete your account and data</li>
                <li>Outstanding orders may be canceled</li>
              </ul>
              <p>
                You may also delete your account at any time by contacting customer support.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page and updating the "Last Updated" date. Continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of The Gambia, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Dispute Resolution</h2>
              <p>
                Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration in accordance with the rules of The Gambia Arbitration Centre.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Severability</h2>
              <p>
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Entire Agreement</h2>
              <p>
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and Lumo regarding the use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
              <p>If you have any questions about these Terms, please contact us:</p>
              <ul className="list-none mb-4">
                <li><strong>Email:</strong> <a href="mailto:legal@julazone.com" className="text-primary underline">legal@julazone.com</a></li>
                <li><strong>Support:</strong> <a href="mailto:support@julazone.com" className="text-primary underline">support@julazone.com</a></li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Acknowledgment</h2>
              <p>
                BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE AND AGREE TO BE BOUND BY THEM.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
