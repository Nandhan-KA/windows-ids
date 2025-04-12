import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Create a transporter with Zoho SMTP settings
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.zoho.in',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'noreply@scholarpeak.in',
    pass: process.env.SMTP_PASS || '',
  },
});

export async function POST(request: Request) {
  try {
    const { to, subject, content } = await request.json();

    // Validate required fields
    if (!to || !subject || !content) {
      console.error('Missing required fields for email:', { to, subject, hasContent: !!content });
      return NextResponse.json(
        { error: 'Missing required fields', fields: { to: !!to, subject: !!subject, content: !!content } },
        { status: 400 }
      );
    }

    // Log email sending attempt
    console.log(`Attempting to send email to ${to} with subject "${subject}"`);

    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@scholarpeak.in',
      to,
      subject,
      text: content,
      html: content.replace(/\n/g, '<br>'),
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully: ${info.messageId}`);
      
      return NextResponse.json({ success: true, messageId: info.messageId });
    } catch (mailError) {
      console.error('Error during email transmission:', mailError);
      return NextResponse.json(
        { 
          error: 'Failed to send email', 
          reason: (mailError as Error).message,
          smtp: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USER ? '✓ (configured)' : '✗ (missing)'
          }
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in email API route:', error);
    return NextResponse.json(
      { error: 'Failed to process email request', details: (error as Error).message },
      { status: 500 }
    );
  }
} 