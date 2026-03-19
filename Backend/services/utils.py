import base64


def file_to_base64(file_bytes: bytes) -> str:
    return base64.b64encode(file_bytes).decode()


def base64_to_file(data: str) -> bytes:
    return base64.b64decode(data)