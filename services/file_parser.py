from pypdf import PdfReader
import pandas as pd
from docx import Document
import io


def parse_pdf(file_bytes):
    reader = PdfReader(io.BytesIO(file_bytes))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def parse_excel(file_bytes):
    df = pd.read_excel(io.BytesIO(file_bytes))
    return df.to_string()


def parse_csv(file_bytes):
    df = pd.read_csv(io.BytesIO(file_bytes))
    return df.to_string()


def parse_docx(file_bytes):
    doc = Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in doc.paragraphs)


def detect_and_parse(filename, file_bytes):

    filename = filename.lower()

    if filename.endswith(".pdf"):
        return parse_pdf(file_bytes)

    if filename.endswith(".xlsx") or filename.endswith(".xls"):
        return parse_excel(file_bytes)

    if filename.endswith(".csv"):
        return parse_csv(file_bytes)

    if filename.endswith(".docx"):
        return parse_docx(file_bytes)

    return file_bytes.decode(errors="ignore")