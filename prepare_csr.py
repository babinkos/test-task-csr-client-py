from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa


def create_csr(user_name):
    # Generate our key
    key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=4096,
    )
    # Write our key to disk for safe keeping
    with open(f"./certs/key_{user_name}.pem", "wb") as f:
        f.write(
            key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.BestAvailableEncryption(
                    b"passphrase"
                ),
            )
        )

    # Generate a CSR
    csr = (
        x509.CertificateSigningRequestBuilder()
        .subject_name(
            x509.Name(
                [
                    # Provide various details about who we are.
                    x509.NameAttribute(NameOID.ORGANIZATION_NAME, "My Test Company"),
                    x509.NameAttribute(NameOID.COMMON_NAME, f"{user_name}"),
                ]
            )
        )
        .add_extension(
            x509.SubjectAlternativeName(
                [
                    x509.RFC822Name(f"{user_name}@domain.test"),
                ]
            ),
            critical=False,
            # Sign the CSR with our private key.
        )
        .sign(key, hashes.SHA512())
    )
    # Write our CSR out to disk.
    with open(f"./certs/csr_{user_name}.pem", "wb") as f:
        f.write(csr.public_bytes(serialization.Encoding.PEM))


for i in range(1, 11):
    create_csr(f"user{i}")
