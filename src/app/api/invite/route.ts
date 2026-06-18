import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { generateIcsContent, ScheduledMeeting } from "@/lib/reminder";

export async function POST(req: NextRequest) {
  try {
    const meeting = (await req.json()) as ScheduledMeeting;

    if (!meeting.attendeeEmail) {
      return NextResponse.json({ error: "Attendee email is required" }, { status: 400 });
    }

    const icsContent = generateIcsContent(meeting);

    // Configure transporter
    // For production, these should be in .env.local
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Orbit Meeting" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: meeting.attendeeEmail,
      subject: `Meeting Invitation: ${meeting.title}`,
      text: `You have been invited to a meeting: ${meeting.title}\n\nLink: ${meeting.link}\nTime: ${meeting.scheduledAt}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h1 style="color: #333;">Meeting Invitation</h1>
          <p>You have been invited to a virtual meeting via <strong>Orbit Meeting</strong>.</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Topic:</strong> ${meeting.title}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date(meeting.scheduledAt).toLocaleString()}</p>
          </div>
          <p>
            <a href="${meeting.link}" style="background: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Join Meeting</a>
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">This is an automated invitation from Orbit Meeting.</p>
        </div>
      `,
      alternatives: [
        {
          contentType: "text/calendar; charset=UTF-8; method=REQUEST",
          content: icsContent,
        },
      ],
      attachments: [
        {
          filename: "invite.ics",
          content: icsContent,
          contentType: "text/calendar; method=REQUEST",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending invite:", error);
    return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 });
  }
}
