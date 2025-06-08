# api/app/email_utils.py

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from .config import settings

def send_reset_email(to_email: str, reset_token: str) -> bool:
    reset_link = f"{settings.FRONTEND_BASE_URL}/reset-password?token={reset_token}"
    message = Mail(
        from_email=settings.MAIL_FROM,
        to_emails=to_email,
        subject="TokenWatcher Password Reset Request",
        html_content=f"""
            <p>Hello,</p>
            <p>You are receiving this email because we received a password reset request for your TokenWatcher account.</p>
            <p>Click the link below to reset your password:</p>
            <p><a href="{reset_link}">{reset_link}</a></p>
            <p>If you did not request a password reset, please ignore this email.</p>
            <br>
            <p>Best regards,<br>TokenWatcher Team</p>
        """
    )
    try:
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        sg.send(message)
        return True
    except Exception as e:
        print("SendGrid error (reset email):", str(e))
        return False

def send_verification_email(to_email: str, verify_token: str) -> bool:
    verify_link = f"{settings.FRONTEND_BASE_URL}/verify-email?token={verify_token}"
    message = Mail(
        from_email=settings.MAIL_FROM,
        to_emails=to_email,
        subject="Verify Your TokenWatcher Account",
        html_content=f"""
            <p>Hello,</p>
            <p>Thank you for registering at TokenWatcher. Please verify your email address by clicking the link below:</p>
            <p><a href="{verify_link}">{verify_link}</a></p>
            <p>If you did not sign up for a TokenWatcher account, please ignore this email.</p>
            <br>
            <p>Best regards,<br>TokenWatcher Team</p>
        """
    )
    try:
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        sg.send(message)
        return True
    except Exception as e:
        print("SendGrid error (verification email):", str(e))
        return False
