# OCR Setup for Intake Document Analysis

Tenant intake document analysis can extract text from PDFs and image uploads using OCR.

## System Packages (Ubuntu/Debian)

Install Tesseract OCR and Poppler:

```bash
sudo apt update
sudo apt install -y tesseract-ocr poppler-utils
```

## Python Dependencies

The following packages must be added to `backend/requirements.txt` before use (they are not currently listed there):
- `pytesseract`
- `pdf2image`
- `PyPDF2`

`Pillow` is already in `requirements.txt`.

## Notes

- OCR is used when a PDF has no embedded text or when the upload is an image.
- If OCR is not available, the analysis will mark the extraction as missing dependencies.
