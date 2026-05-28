"""
Centralised email sending utility using the Resend SDK.

Usage:
    from apps.users.email_utils import send_email

    send_email(
        to="someone@example.com",
        subject="Hello!",
        html="<p>Hello!</p>",
    )
"""
import logging
import os

import resend

logger = logging.getLogger(__name__)

# Resend requires a verified "from" domain.
# For testing you can use the Resend sandbox address: onboarding@resend.dev
# Once you verify a domain (e.g. inkspire2.onrender.com) update this to:
#   "Inkspire <noreply@yourdomain.com>"
FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "Inkspire <onboarding@resend.dev>")


def send_email(
    to: str | list[str],
    subject: str,
    html: str,
    from_email: str = None,
) -> bool:
    """
    Send an HTML email via Resend.

    Args:
        to:         Recipient email or list of emails.
        subject:    Email subject line.
        html:       HTML body of the email.
        from_email: Override the default FROM address (optional).

    Returns:
        True if sent successfully, False otherwise.
    """
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        logger.error("RESEND_API_KEY is not set — email not sent.")
        return False

    resend.api_key = api_key

    recipients = [to] if isinstance(to, str) else to

    try:
        params: resend.Emails.SendParams = {
            "from": from_email or FROM_EMAIL,
            "to": recipients,
            "subject": subject,
            "html": html,
        }
        response = resend.Emails.send(params)
        logger.info(f"Email sent via Resend to {recipients} | id={response.get('id')}")
        return True
    except Exception as e:
        logger.error(f"Resend email failed to {recipients}: {e}")
        return False
