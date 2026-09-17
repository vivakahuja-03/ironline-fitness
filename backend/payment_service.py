"""
JazzCash Payment Gateway integration (Hosted Checkout, HTTP POST v1.1).

Why JazzCash:
  - Stripe does not allow merchant signup from Pakistan.
  - Safepay's hosted checkout page is currently broken for v1-API integrations
    (its card fields fail with "You have not supplied a valid capture context",
    a mismatch between their old API and their newer Cybersource Microform page).
  - JazzCash sandbox is self-service: sign up free at
    https://sandbox.jazzcash.com.pk, provide a Return URL, generate credentials.
    No KYC documents needed for sandbox (only for going live).

How it works (no SDK, no external package — just a signed form POST):
  1. We build a set of pp_* fields describing the transaction.
  2. We sign them with HMAC-SHA256 using the Integrity Salt.
  3. The browser POSTs that form to JazzCash's hosted page.
  4. The customer pays there.
  5. JazzCash POSTs the result back to our pp_ReturnURL, signed the same way.
  6. We recompute the hash to verify authenticity before trusting it.

Required in .env:
  JAZZCASH_ENVIRONMENT    sandbox | production
  JAZZCASH_MERCHANT_ID    from your JazzCash sandbox dashboard
  JAZZCASH_PASSWORD       from your JazzCash sandbox dashboard
  JAZZCASH_INTEGRITY_SALT from your JazzCash sandbox dashboard (aka Hash Key)
  JAZZCASH_TXN_TYPE       MIGS (card) | MWALLET (JazzCash mobile wallet) | OTC (voucher)
  BACKEND_URL             e.g. http://127.0.0.1:8000
  FRONTEND_URL            e.g. http://127.0.0.1:5500

CURRENCY NOTE:
  JazzCash only processes PKR. The membership_plans prices are therefore
  treated as PKR amounts. JazzCash expects the amount in paisa (the smallest
  unit) — confirmed by their own sample code, which uses `1*100` to mean Rs 1 —
  so we multiply by 100 here.
"""
import os
import hmac
import hashlib
from datetime import datetime, timedelta


SANDBOX_POST_URL = "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform"
PRODUCTION_POST_URL = "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform"


def _configured() -> bool:
    return bool(os.getenv("JAZZCASH_MERCHANT_ID")) and bool(os.getenv("JAZZCASH_INTEGRITY_SALT"))


def get_post_url() -> str:
    env = os.getenv("JAZZCASH_ENVIRONMENT", "sandbox").lower()
    return PRODUCTION_POST_URL if env == "production" else SANDBOX_POST_URL


def compute_secure_hash(fields: dict, integrity_salt: str) -> str:
    """
    JazzCash's pp_SecureHash algorithm:
      1. Take every pp_* / ppmpf_* field that has a non-empty value
         (excluding pp_SecureHash itself).
      2. Sort those keys alphabetically.
      3. Join their VALUES with "&".
      4. Prefix the whole string with the Integrity Salt + "&".
      5. HMAC-SHA256 that string, keyed with the Integrity Salt.
      6. Return uppercase hex.

    The same function verifies JazzCash's response, since they sign their
    callback to us using the identical scheme.
    """
    relevant = {
        k: str(v)
        for k, v in fields.items()
        if k != "pp_SecureHash"
        and (k.startswith("pp_") or k.startswith("ppmpf_"))
        and v is not None
        and str(v) != ""
    }
    ordered_values = [relevant[k] for k in sorted(relevant.keys())]
    message = integrity_salt + "&" + "&".join(ordered_values)
    return hmac.new(
        integrity_salt.encode("utf-8"),
        msg=message.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest().upper()


def build_payment_fields(amount_pkr: float, payment_id: int, customer_email: str, description: str) -> dict:
    """
    Builds the complete, signed set of form fields to POST to JazzCash.
    Returns a dict ready to render as hidden inputs.
    """
    if not _configured():
        raise RuntimeError(
            "JazzCash is not configured. Set JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD "
            "and JAZZCASH_INTEGRITY_SALT in backend/.env — get these free from your "
            "JazzCash sandbox dashboard at https://sandbox.jazzcash.com.pk."
        )

    integrity_salt = os.getenv("JAZZCASH_INTEGRITY_SALT")
    backend_url = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")

    now = datetime.now()
    expiry = now + timedelta(hours=3)

    # JazzCash wants the amount in paisa (Rs 1 => "100"), per their own sample code.
    amount_paisa = str(int(round(amount_pkr * 100)))

    fields = {
        "pp_Version": "1.1",
        "pp_TxnType": os.getenv("JAZZCASH_TXN_TYPE", "MIGS"),
        "pp_Language": "EN",
        "pp_MerchantID": os.getenv("JAZZCASH_MERCHANT_ID"),
        "pp_SubMerchantID": "",
        "pp_Password": os.getenv("JAZZCASH_PASSWORD", ""),
        "pp_BankID": "",
        "pp_ProductID": "",
        # Reference must be unique per attempt; include payment_id so the
        # callback can be traced straight back to our DB row.
        "pp_TxnRefNo": f"T{now.strftime('%Y%m%d%H%M%S')}{payment_id}",
        "pp_Amount": amount_paisa,
        "pp_TxnCurrency": "PKR",
        "pp_TxnDateTime": now.strftime("%Y%m%d%H%M%S"),
        "pp_TxnExpiryDateTime": expiry.strftime("%Y%m%d%H%M%S"),
        "pp_BillReference": f"membership{payment_id}",
        "pp_Description": description,
        "pp_ReturnURL": f"{backend_url}/api/jazzcash-return",
        # ppmpf_1 carries our own payment id through JazzCash and back again,
        # so the callback can find the right row even if the ref number changes.
        "ppmpf_1": str(payment_id),
        "ppmpf_2": "",
        "ppmpf_3": "",
        "ppmpf_4": "",
        "ppmpf_5": "",
    }

    fields["pp_SecureHash"] = compute_secure_hash(fields, integrity_salt)
    return fields


def verify_response(response_fields: dict) -> bool:
    """
    Verifies the pp_SecureHash JazzCash sends back with its callback.
    Pure local HMAC check — no network call. Returns True if authentic.
    """
    if not _configured():
        raise RuntimeError("JazzCash is not configured. Set JAZZCASH_INTEGRITY_SALT in backend/.env.")

    integrity_salt = os.getenv("JAZZCASH_INTEGRITY_SALT")
    received_hash = (response_fields.get("pp_SecureHash") or "").upper()
    if not received_hash:
        return False

    expected_hash = compute_secure_hash(response_fields, integrity_salt)
    # constant-time comparison to avoid timing attacks
    return hmac.compare_digest(received_hash, expected_hash)


def is_successful(response_fields: dict) -> bool:
    """JazzCash returns pp_ResponseCode '000' for a successful transaction."""
    return str(response_fields.get("pp_ResponseCode", "")).strip() == "000"