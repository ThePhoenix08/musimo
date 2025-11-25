import os
import smtplib
from email.message import EmailMessage

from ..core.settings import settings


def send_otp_email(receiver_email: str, otp: str) -> bool:

    sender_email = settings.SMTP_USERNAME
    sender_password = settings.SMTP_PASSWORD
    smtp_host = settings.SMTP_HOST or "smtp.gmail.com"
    smtp_port = int(settings.SMTP_PORT or 587)

    msg = EmailMessage()
    msg["Subject"] = "Your Musimo OTP Code"
    msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
    msg["To"] = receiver_email
    msg.set_content(
        f"Hello {receiver_email} \n\nYour OTP code is: {otp}\n\n This code will expire in 10 minutes.\n\n\n If you did not request this, please ignore this email. \n\n Best regards,\nMusimo Team"
    )

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as smtp:
            smtp.starttls()
            smtp.login(sender_email, sender_password)
            smtp.send_message(msg)

        return True

    except Exception as e:
        print(f"Error sending OTP email: {e}")
        return False
