# api/app/email_utils.py

import os
from typing import List # Se añade List para el tipado
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from .config import settings
from . import schemas

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
    <p>Best regards,<br>The TokenWatcher Team</p>
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
    <p>Best regards,<br>The TokenWatcher Team</p>
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
    <p>Best regards,<br>The TokenWatcher Team</p>
    """
    return send_email(email_to, subject, html_content)


def send_contact_form_email(form_data: schemas.ContactFormRequest):
    """
    Envía el contenido de un formulario de contacto al email de soporte.
    """
    to_email = settings.CONTACT_FORM_RECIPIENT_EMAIL
    subject = f"[TokenWatcher Contact] New message from {form_data.name}"
    formatted_message = form_data.message.replace('\n', '<br>')
    
    html_content = f"""
    <html><body>
        <h2>New Contact Form Submission</h2><hr>
        <p><strong>Name:</strong> {form_data.name}</p>
        <p><strong>Reply-to Email:</strong> {form_data.email}</p>
        <p><strong>Message:</strong></p><p>{formatted_message}</p><hr>
    </body></html>
    """
    return send_email(to_email, subject, html_content)

# === NUEVA FUNCIÓN PARA ENVIAR LOTES DE ALERTAS POR EMAIL ===
def send_token_alert_email_batch(to_email: str, watcher_name: str, events: List[schemas.TokenEventRead]):
    """
    Envía un único email de resumen para un lote de eventos de token.
    """
    event_count = len(events)
    subject = f"🚨 TokenWatcher Alert: {event_count} New Event(s) Detected for '{watcher_name}'"
    
    # Construimos las filas de la tabla para cada evento
    event_rows_html = ""
    for event in events:
        amount_formatted = f"{event.amount:,.4f} {event.token_symbol or ''}".strip()
        usd_value_formatted = f"${event.usd_value:,.2f}" if event.usd_value is not None else "N/A"
        etherscan_link = f"{settings.ETHERSCAN_TX_URL}/{event.transaction_hash}"
        
        event_rows_html += f"""
        <tr>
            <td>{amount_formatted}</td>
            <td>{usd_value_formatted}</td>
            <td><a href="{etherscan_link}">View Tx</a></td>
        </tr>
        """

    # Plantilla de email profesional para el resumen de alertas
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #333; }}
        .container {{ border: 1px solid #e1e1e1; padding: 25px; border-radius: 8px; max-w: 600px; margin: auto; background-color: #f9f9f9; }}
        .header {{ font-size: 24px; color: #1a1a1a; margin-bottom: 20px; font-weight: 600;}}
        .summary-table {{ width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }}
        .summary-table th {{ background-color: #f2f2f2; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }}
        .summary-table td {{ padding: 12px; border-bottom: 1px solid #eee; text-align: left; }}
        .footer {{ margin-top: 25px; font-size: 12px; color: #888; text-align: center; }}
    </style>
    </head>
    <body>
        <div class="container">
            <h1 class="header">Token Transfer Alert Summary</h1>
            <p>We detected <strong>{event_count}</strong> new significant transfer(s) for your watcher: <strong>{watcher_name}</strong></p>
            <table class="summary-table">
                <thead>
                    <tr>
                        <th>Amount</th>
                        <th>USD Value</th>
                        <th>Transaction</th>
                    </tr>
                </thead>
                <tbody>
                    {event_rows_html}
                </tbody>
            </table>
        </div>
        <div class="footer">
            <p>You received this alert because you configured this watcher on TokenWatcher.</p>
        </div>
    </body>
    </html>
    """
    
    return send_email(to_email, subject, html_content)