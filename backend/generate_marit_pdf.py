from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os

def generate_summary():
    path = "c:\\Users\\Santosh\\Documents\\webinar-mentor\\backend\\static\\MaritsMetode_Summary.pdf"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    
    c = canvas.Canvas(path, pagesize=letter)
    width, height = letter
    
    # Title
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(width/2, height - 100, "Marits Metode: Cross-Country Mastery")
    
    # Author
    c.setFont("Helvetica", 12)
    c.drawCentredString(width/2, height - 130, "A Strategic Framework for Peak Performance")
    
    # Body
    c.setFont("Helvetica", 11)
    lines = [
        "1. THE CONTINUITY PRINCIPLE",
        "Performance is built over seasons, not weeks. Success requires the discipline to maintain",
        "intensity and volume consistently, avoiding the traps of overtraining and injury.",
        "",
        "2. BASE ENDURANCE STRATEGY",
        "The foundation of all mastery is a massive base. Marit's method emphasizes the 'Polarized'",
        "training model - mostly low intensity, with high-intensity bursts that count for everything.",
        "",
        "3. MENTAL TOUGHNESS & RECOVERY",
        "Recovery is not an absence of work; it is an active component of the training loop.",
        "Knowing when to push and when to rest is the 'Secret Sauce' of champions.",
        "",
        "4. TECHNICAL PRECISION",
        "In cross-country, like in business, efficiency beats raw power. Every movement should",
        "contribute to forward momentum. Refine the mechanics until they are second nature.",
        "",
        "--- APPLICABLE WEBINAR THEMES ---",
        "- Mastery through Persistence",
        "- The Science of Recovery and Peak Performance",
        "- Building a Foundation for Long-term Success",
    ]
    
    y = height - 180
    for line in lines:
        c.drawString(100, y, line)
        y -= 20
        
    c.showPage()
    c.save()
    print(f"Generated {path}")

if __name__ == "__main__":
    generate_summary()
