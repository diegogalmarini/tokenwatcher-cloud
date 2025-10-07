# api/app/email_utils.py

import os
from typing import List
from datetime import datetime
import resend
from .config import settings
from . import schemas

def _create_styled_html_content(title: str, body_html: str) -> str:
    """
    Creates a styled HTML container for the email content.
    """
    logo_url = "https://www.tokenwatcher.app/TokenWatcherB.png" # URL del logo
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f7; color: #333; }}
        .email-container {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e1e1e1; border-radius: 8px; overflow: hidden; }}
        .email-header {{ background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #e1e1e1;}}
        .email-header img {{ max-height: 50px; }}
        .email-body {{ padding: 30px; line-height: 1.6; font-size: 16px; }}
        .email-body h2 {{ font-size: 20px; color: #1a1a1a; margin-top: 0;}}
        .email-body a {{ color: #3b82f6; text-decoration: none; font-weight: 600; }}
        .email-body .button {{ display: inline-block; background-color: #3b82f6; color: #ffffff !important; padding: 12px 25px; margin: 20px 0; border-radius: 5px; text-decoration: none; font-weight: bold; }}
        .email-footer {{ background-color: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #e1e1e1; }}
    </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <img src="{logo_url}" alt="TokenWatcher Logo">
            </div>
            <div class="email-body">
                <h2>{title}</h2>
                {body_html}
                <p>If you have any questions, feel free to contact our support team.</p>
                <p>Best regards,<br>The TokenWatcher Team</p>
            </div>
            <div class="email-footer">
                <p>&copy; {datetime.now().year} TokenWatcher. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """
    Generic function to send an email using Resend.
    """
    try:
        resend.api_key = settings.RESEND_API_KEY
        
        params = {
            "from": settings.MAIL_FROM,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }
        
        response = resend.Emails.send(params)
        print(f"Email sent to {to_email}, response: {response}")
        return True
    except Exception as e:
        print(f"Error sending email to {to_email}: {e}")
        return False

def send_verification_email(email_to: str, token: str):
    """
    Sends the account verification email.
    """
    subject = "Verify your TokenWatcher Account"
    verification_link = f"{settings.FRONTEND_BASE_URL}/verify-email?token={token}"
    body_html = f"""
    <p>Hello,</p>
    <p>Thank you for registering at TokenWatcher. Please verify your email address by clicking the button below:</p>
    <a href="{verification_link}" class="button">Verify My Email</a>
    <p>If the button doesn't work, you can also copy and paste this link into your browser:<br><a href="{verification_link}">{verification_link}</a></p>
    <p>If you did not sign up for a TokenWatcher account, please ignore this email.</p>
    """
    styled_html = _create_styled_html_content("Account Verification", body_html)
    return send_email(email_to, subject, styled_html)


def send_reset_email(email_to: str, token: str):
    """
    Sends the password reset email.
    """
    subject = "Your TokenWatcher Password Reset Request"
    reset_link = f"{settings.FRONTEND_BASE_URL}/reset-password?token={token}"
    body_html = f"""
    <p>Hello,</p>
    <p>You requested a password reset for your TokenWatcher account. Click the button below to set a new password:</p>
    <a href="{reset_link}" class="button">Reset Password</a>
    <p>This link will expire in 15 minutes. If you did not request a password reset, please ignore this email.</p>
    <p>If the button doesn't work, copy and paste this link into your browser:<br><a href="{reset_link}">{reset_link}</a></p>
    """
    styled_html = _create_styled_html_content("Password Reset", body_html)
    return send_email(email_to, subject, styled_html)


def send_watcher_limit_update_email(email_to: str, new_limit: int):
    """
    Notifies the user that their watcher limit has been updated.
    """
    subject = "Your TokenWatcher Watcher Limit Has Been Updated"
    body_html = f"""
    <p>Hello,</p>
    <p>This is a notification to inform you that your watcher limit on TokenWatcher has been updated.</p>
    <p>Your new limit is: <strong>{new_limit} watchers</strong>.</p>
    <p>You can now log in to your dashboard to create new watchers up to your new limit.</p>
    """
    styled_html = _create_styled_html_content("Account Update", body_html)
    return send_email(email_to, subject, styled_html)

def send_plan_change_email(email_to: str, new_plan_name: str):
    """
    Notifies the user that their plan has been changed.
    """
    subject = "Your TokenWatcher Plan Has Been Updated"
    body_html = f"""
    <p>Hello,</p>
    <p>This is a notification to inform you that your plan on TokenWatcher has been updated.</p>
    <p>Your new plan is: <strong>{new_plan_name}</strong>.</p>
    <p>You can log in to your dashboard to see the details of your new plan. Your watcher limit has been automatically updated.</p>
    """
    styled_html = _create_styled_html_content("Account Update", body_html)
    return send_email(email_to, subject, styled_html)


def send_contact_form_email(form_data: schemas.ContactFormRequest):
    """
    Sends the content of a contact form to the support email.
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

def send_token_alert_email_batch(to_email: str, watcher_name: str, events: List[schemas.TokenEventRead]):
    """
    Sends a single summary email for a batch of token events.
    """
    event_count = len(events)
    subject = f"🚨 {event_count} New Alert(s) for '{watcher_name}'"
    
    event_rows_html = ""
    for event in events:
        amount_formatted = f"{event.amount:,.4f} {event.token_symbol or ''}".strip()
        usd_value_formatted = f"${event.usd_value:,.2f}" if event.usd_value is not None else "N/A"
        etherscan_link = f"{settings.ETHERSCAN_TX_URL}/{event.transaction_hash}"
        
        event_rows_html += f"""
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: left;">{amount_formatted}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: left;">{usd_value_formatted}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: left;"><a href="{etherscan_link}" style="color: #3b82f6; text-decoration: none; font-weight: 600;">View Tx</a></td>
        </tr>
        """

    body_html = f"""
    <p>We detected <strong>{event_count}</strong> new significant transfer(s) for your watcher: <strong>{watcher_name}</strong></p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
        <thead>
            <tr>
                <th style="background-color: #f2f2f2; padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Amount</th>
                <th style="background-color: #f2f2f2; padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">USD Value</th>
                <th style="background-color: #f2f2f2; padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Transaction</th>
            </tr>
        </thead>
        <tbody>
            {event_rows_html}
        </tbody>
    </table>
    """
    styled_html = _create_styled_html_content("Token Transfer Alert", body_html)
    return send_email(to_email, subject, styled_html)
