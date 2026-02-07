import smtplib
from email.message import EmailMessage
from email.utils import formataddr

from src.core.logger_setup import logger
from src.core.settings import CONSTANTS


def send_otp_email(receiver_email: str, otp: str) -> bool:
    """
    Sends a beautiful HTML OTP email to the given address.
    """
    sender_email = CONSTANTS.SMTP_USERNAME
    sender_password = CONSTANTS.SMTP_PASSWORD
    smtp_host = CONSTANTS.SMTP_HOST or "smtp.gmail.com"
    smtp_port = int(CONSTANTS.SMTP_PORT or 587)

    msg = EmailMessage()
    msg["Subject"] = "🔐 Your Musimo Account Email Verification Code"
    msg["From"] = formataddr((CONSTANTS.MAIL_FROM_NAME, CONSTANTS.EMAIL_FROM))
    msg["To"] = receiver_email

    # Plain text fallback
    msg.set_content(
        f"Hello,\n\nYour OTP code is: {otp}\n\nThis code will expire in "
        f"{CONSTANTS.OTP_EXPIRE_MINUTES} minutes.\n\nIf you did not request this, "
        "please ignore this email.\n\n— Musimo Team"
    )

    # Fancy HTML version
    html_body = f"""
    <html>
      <body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px; color: #111;">
        <div style="max-width: 480px; margin: auto; background: white; border-radius: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #5B21B6, #7C3AED); padding: 20px 0; text-align: center;">
            <h2 style="color: #fff; margin: 0;">Musimo</h2>
            <p style="color: #ddd; font-size: 14px; margin: 4px 0 0;">Secure Email Verification</p>
          </div>
          <div style="padding: 32px 24px 40px; text-align: center;">
            <h3 style="color: #111; font-size: 18px;">Your One-Time Password (OTP)</h3>
            <p style="color: #555; font-size: 14px;">Use the code below to complete your email verification. This code expires in <b>{CONSTANTS.OTP_EXPIRE_MINUTES} minutes</b>.</p>
            
            <div style="
                margin: 24px auto;
                background: #f3f4f6;
                display: inline-block;
                padding: 14px 32px;
                border-radius: 8px;
                font-size: 28px;
                font-weight: bold;
                letter-spacing: 8px;
                color: #111;
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
            ">
              {otp}
            </div>

            <p style="color: #888; font-size: 13px; margin-top: 32px;">
              If you didn't request this code, you can safely ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

            <p style="color: #aaa; font-size: 12px;">
              © {CONSTANTS.APP_NAME} • All rights reserved
            </p>
          </div>
        </div>
      </body>
    </html>
    """

    msg.add_alternative(html_body, subtype="html")

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as smtp:
            smtp.starttls()
            smtp.login(sender_email, sender_password)
            smtp.send_message(msg)

        logger.info(f"✅ OTP email sent to {receiver_email}")
        return True

    except Exception as e:
        logger.exception(f"❌ Error sending OTP email to {receiver_email}: {e}")
        return False
