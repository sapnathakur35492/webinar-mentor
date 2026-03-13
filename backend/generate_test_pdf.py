from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import os

def create_pdf(filename):
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter
    
    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, height - 100, "Mentor Maestro - Test Onboarding Document")
    
    # Body
    c.setFont("Helvetica", 12)
    text = [
        "This is a test document for the webinar mentor onboarding flow.",
        "It contains words that should be extracted by the AI service.",
        "",
        "Topic: How to scale your coaching business using webinars.",
        "Key points:",
        "1. Identify your niche.",
        "2. Create a compelling offer.",
        "3. Automate the registration process.",
        "4. Follow up with attendees using high-conversion emails.",
        "",
        "This document is used to verify that the PDF upload and content extraction",
        "work correctly in the backend system."
    ]
    
    y_position = height - 130
    for line in text:
        c.drawString(100, y_position, line)
        y_position -= 20
        
    c.save()
    print(f"PDF created successfully: {filename}")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_path = os.path.join(current_dir, "test_onboarding_v2.pdf")
    create_pdf(pdf_path)
