# api/app/email_utils.py

import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from .config import settings

def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """
    Función genérica para enviar un email usando SendGrid.
    """
    message = Mail(
        from_email=settings.MAIL_FROM,
        to_emails=to_email,
        subject=subject,
        html_content=html_content
    )
    try:
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"Email sent to {to_email}, status code: {response.status_code}")
        return response.status_code in [200, 202]
    except Exception as e:
        print(f"Error sending email to {to_email}: {e}")
        return False

def send_verification_email(email_to: str, token: str):
    """
    Envía el email de verificación de cuenta.
    """
    subject = "Verify your TokenWatcher Account"
    verification_link = f"{settings.FRONTEND_BASE_URL}/verify-email?token={token}"
    html_content = f"""
    <p>Hello,</p>
    <p>Thank you for registering at TokenWatcher. Please verify your email address by clicking the link below:</p>
    <p><a href="{verification_link}">{verification_link}</a></p>
    <p>If you did not sign up for a TokenWatcher account, please ignore this email.</p>
    <br>
    <p>Best regards,<br>TokenWatcher Team</p>
    """
    return send_email(email_to, subject, html_content)


def send_reset_email(email_to: str, token: str):
    """
    Envía el email para resetear la contraseña.
    """
    subject = "Your TokenWatcher Password Reset Request"
    reset_link = f"{settings.FRONTEND_BASE_URL}/reset-password?token={token}"
    html_content = f"""
    <p>Hello,</p>
    <p>You requested a password reset for your TokenWatcher account. Please click the link below to set a new password:</p>
    <p><a href="{reset_link}">{reset_link}</a></p>
    <p>This link will expire in 15 minutes. If you did not request a password reset, please ignore this email.</p>
    <br>
    <p>Best regards,<br>TokenWatcher Team</p>
    """
    return send_email(email_to, subject, html_content)

# --- NUEVA FUNCIÓN DE EMAIL ---
def send_watcher_limit_update_email(email_to: str, new_limit: int):
    """
    Notifica al usuario que su límite de watchers ha sido actualizado.
    """
    subject = "Your TokenWatcher Watcher Limit Has Been Updated"
    html_content = f"""
    <p>Hello,</p>
    <p>This is a notification to inform you that your watcher limit on TokenWatcher has been updated.</p>
    <p>Your new limit is: <strong>{new_limit} watchers</strong>.</p>
    <p>You can now log in to your dashboard to create new watchers up to your new limit.</p>
    <br>
    <p>Best regards,<br>TokenWatcher Team</p>
    """
    return send_email(email_to, subject, html_content)