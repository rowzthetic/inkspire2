"""
Centralised email sending utility using the Brevo (Sendinblue) SDK.
Works on the FREE tier using a verified personal email (e.g., Gmail).

Usage:
    from apps.users.email_utils import send_email

    send_email(
        to="any_user@example.com",  # Can be anyone!
        subject="Hello!",
        html="<p>Hello!</p>",
    )
"""

import logging
import os

import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

logger = logging.getLogger(__name__)

# IMPORTANT: This MUST match the exact Gmail/free email you verified in Brevo!
FROM_EMAIL = os.getenv("BREVO_FROM_EMAIL", "your_verified_gmail@gmail.com")
FROM_NAME = os.getenv("BREVO_FROM_NAME", "Inkspire Team")


def send_email(
    to: str | list[str],
    subject: str,
    html: str,
    from_email: str = None,
) -> bool:
    """
    Send a transactional HTML email via Brevo using a single verified sender.
    """
    api_key = os.getenv("BREVO_API_KEY")
    if not api_key:
        logger.error("BREVO_API_KEY environment variable is not set — email not sent.")
        return False

    # Configure API key authorization
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key["api-key"] = api_key

    # Initialize the Transactional Emails API instance
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
        sib_api_v3_sdk.ApiClient(configuration)
    )

    # Normalize single recipient string into a list of Brevo SendSmtpEmailTo objects
    recipient_list = [to] if isinstance(to, str) else to
    to_field = [sib_api_v3_sdk.SendSmtpEmailTo(email=email) for email in recipient_list]

    # Set up the sender (Must be your verified email or Brevo will reject it)
    sender_field = sib_api_v3_sdk.SendSmtpEmailSender(
        name=FROM_NAME, email=from_email or FROM_EMAIL
    )

    # Define the email parameters
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to_field,
        sender=sender_field,
        subject=subject,
        html_content=html,
    )

    try:
        # Make the call to Brevo
        api_instance.send_transac_email(send_smtp_email)
        logger.info(f"Email successfully sent via Brevo to {recipient_list}")
        return True
    except ApiException as e:
        logger.error(f"Brevo API exception when sending to {recipient_list}: {e}")
        return False
    except Exception as e:
        logger.error(
            f"Unexpected error when sending via Brevo to {recipient_list}: {str(e)}"
        )
        return False
