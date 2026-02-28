import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Required when SMTP_HOST is an IP address: certificates are issued for
    // domain names, so strict verification would always fail against an IP.
    rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false'
      ? !/^\d{1,3}(\.\d{1,3}){3}$/.test(process.env.SMTP_HOST || '')
      : false,
  },
});

export async function sendMail(options: {
  to:      string[];
  subject: string;
  html:    string;
}): Promise<void> {
  const from = process.env.SMTP_FROM || `"Editorial TARAM" <${process.env.SMTP_USER}>`;
  await transporter.sendMail({
    from,
    to:      options.to.join(', '),
    subject: options.subject,
    html:    options.html,
  });
}
