from typing import Dict, Optional
import io

try:
    import PyPDF2
except Exception:
    PyPDF2 = None

try:
    from pdf2image import convert_from_bytes
except Exception:
    convert_from_bytes = None

try:
    import pytesseract
except Exception:
    pytesseract = None

try:
    from PIL import Image
except Exception:
    Image = None


def _extract_text_pdf(content_bytes: bytes) -> Dict[str, Optional[str]]:
    if PyPDF2 is None:
        return {
            'text': '',
            'status': 'missing_dependency',
            'requires_ocr': None,
            'error': 'PyPDF2 is not installed'
        }

    try:
        reader = PyPDF2.PdfReader(io.BytesIO(content_bytes))
        chunks = []
        for page in reader.pages:
            try:
                chunks.append(page.extract_text() or '')
            except Exception:
                continue
        text = '\n'.join(chunks).strip()
        return {
            'text': text,
            'status': 'ok' if text else 'no_text_extracted',
            'requires_ocr': True if not text else False,
            'error': None
        }
    except Exception as exc:
        return {
            'text': '',
            'status': 'error',
            'requires_ocr': None,
            'error': str(exc)
        }


def _extract_text_image(content_bytes: bytes) -> Dict[str, Optional[str]]:
    if Image is None:
        return {
            'text': '',
            'status': 'missing_dependency',
            'requires_ocr': True,
            'error': 'Pillow is not installed'
        }
    if pytesseract is None:
        return {
            'text': '',
            'status': 'missing_dependency',
            'requires_ocr': True,
            'error': 'pytesseract is not installed'
        }
    try:
        image = Image.open(io.BytesIO(content_bytes))
        text = pytesseract.image_to_string(image)
        return {
            'text': text.strip(),
            'status': 'ok' if text else 'no_text_extracted',
            'requires_ocr': False,
            'error': None
        }
    except Exception as exc:
        return {
            'text': '',
            'status': 'error',
            'requires_ocr': None,
            'error': str(exc)
        }


def _extract_text_pdf_ocr(content_bytes: bytes) -> Dict[str, Optional[str]]:
    if convert_from_bytes is None:
        return {
            'text': '',
            'status': 'missing_dependency',
            'requires_ocr': True,
            'error': 'pdf2image is not installed'
        }
    if pytesseract is None:
        return {
            'text': '',
            'status': 'missing_dependency',
            'requires_ocr': True,
            'error': 'pytesseract is not installed'
        }
    try:
        pages = convert_from_bytes(content_bytes)
        chunks = []
        for page in pages:
            try:
                chunks.append(pytesseract.image_to_string(page) or '')
            except Exception:
                continue
        text = '\n'.join(chunks).strip()
        return {
            'text': text,
            'status': 'ok' if text else 'no_text_extracted',
            'requires_ocr': False,
            'error': None
        }
    except Exception as exc:
        return {
            'text': '',
            'status': 'error',
            'requires_ocr': None,
            'error': str(exc)
        }


def extract_text(content_bytes: bytes, content_type: Optional[str], filename: Optional[str]) -> Dict[str, Optional[str]]:
    ext = (filename or '').split('.')[-1].lower()
    is_text = (content_type or '').startswith('text/') or ext in {'txt', 'rtf'}
    if is_text:
        try:
            text = content_bytes.decode('utf-8', errors='ignore')
            return {
                'text': text,
                'status': 'ok' if text else 'no_text_extracted',
                'requires_ocr': False,
                'error': None
            }
        except Exception as exc:
            return {
                'text': '',
                'status': 'error',
                'requires_ocr': None,
                'error': str(exc)
            }

    if content_type == 'application/pdf' or ext == 'pdf':
        pdf_result = _extract_text_pdf(content_bytes)
        if pdf_result.get('requires_ocr'):
            ocr_result = _extract_text_pdf_ocr(content_bytes)
            if ocr_result.get('text'):
                return ocr_result
            return pdf_result
        return pdf_result

    if (content_type or '').startswith('image/') or ext in {'png', 'jpg', 'jpeg', 'heic'}:
        return _extract_text_image(content_bytes)

    return {
        'text': '',
        'status': 'unsupported_format',
        'requires_ocr': None,
        'error': None
    }
