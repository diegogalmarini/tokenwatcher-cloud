# api/app/email_utils.py

import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from .config import settings
from .schemas import ContactFormRequest

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


# --- FUNCIÓN CORREGIDA PARA EL FORMULARIO DE CONTACTO ---
def send_contact_form_email(form_data: ContactFormRequest):
    """
    Envía el contenido de un formulario de contacto al email de soporte.
    """
    to_email = settings.CONTACT_FORM_RECIPIENT_EMAIL
    subject = f"[TokenWatcher Contact] New message from {form_data.name}"

    # --- AQUÍ ESTÁ LA CORRECCIÓN ---
    # 1. Reemplazamos los saltos de línea en una variable separada.
    formatted_message = form_data.message.replace('\n', '<br>')
    
    # 2. Usamos esa nueva variable limpia en el f-string.
    html_content = f"""
    <html>
    <body>
        <h2>New Contact Form Submission</h2>
        <p>You have received a new message from your TokenWatcher contact form.</p>
        <hr>
        <p><strong>Name:</strong> {form_data.name}</p>
        <p><strong>Reply-to Email:</strong> {form_data.email}</p>
        <p><strong>Message:</strong></p>
        <p>{formatted_message}</p>
        <hr>
        <p>This email was sent from the TokenWatcher contact form.</p>
    </body>
    </html>
    """
    return send_email(to_email, subject, html_content)