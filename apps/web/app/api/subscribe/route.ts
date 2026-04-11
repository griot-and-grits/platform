import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email, type } = await req.json();
  
  if (!email) {
    return NextResponse.json({ error: 'Email is required!' }, { status: 400 });
  }

  const MailchimpKey = process.env.MAILCHIMP_API_KEY;
  const MailchimpServer = process.env.MAILCHIMP_API_SERVER;
  const MailchimpAudience = process.env.MAILCHIMP_AUDIENCE_ID;

  const customUrl = `https://${MailchimpServer}.api.mailchimp.com/3.0/lists/${MailchimpAudience}/members`;

  const response = await fetch(customUrl, {
    method: 'POST',
    headers: {
      Authorization: `apikey ${MailchimpKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        TYPE: type,
      }
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error:'Failed to subscribe, please ensure your email is correct and that you have not already subscribed' }, { status: response.status });
  }

  const received = await response.json();
  return NextResponse.json(received);
}